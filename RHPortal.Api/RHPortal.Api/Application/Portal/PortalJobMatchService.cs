using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using RhPortal.Api.Application.ResumeParsing;

namespace RhPortal.Api.Application.Portal;

public interface IPortalJobMatchService
{
    Task<JobMatchResult> ComputeAsync(object snapshot, bool includeReasons, CancellationToken ct);
}

public sealed record JobMatchResult(IReadOnlyList<JobMatchItem> Matches);
public sealed record JobMatchItem(Guid VagaId, int Score, string? Reason);

public sealed class PortalJobMatchService : IPortalJobMatchService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenAIOptions _options;
    private readonly ILogger<PortalJobMatchService> _logger;

    public PortalJobMatchService(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAIOptions> options,
        ILogger<PortalJobMatchService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<JobMatchResult> ComputeAsync(object snapshot, bool includeReasons, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new InvalidOperationException("OpenAI API key ausente.");

        var requestPayload = BuildOpenAIRequest(snapshot, _options.Model, includeReasons);
        var json = JsonSerializer.Serialize(requestPayload, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        var responseJson = await SendWithRetryAsync(json, ct);
        var outputJson = ExtractOutputJson(responseJson);

        var parsed = JsonSerializer.Deserialize<JobMatchResponseDto>(outputJson, JsonOptions)
                     ?? new JobMatchResponseDto();

        var matches = NormalizeMatches(parsed.Matches, includeReasons);
        return new JobMatchResult(matches);
    }

    private async Task<string> SendWithRetryAsync(string json, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient("OpenAI");
        var endpoint = new Uri(client.BaseAddress ?? new Uri("https://api.openai.com/v1/"), "responses");

        for (var attempt = 0; attempt < 2; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };

                using var response = await client.SendAsync(request, ct);
                var body = await response.Content.ReadAsStringAsync(ct);

                if (response.IsSuccessStatusCode)
                    return body;

                if (attempt == 0 && ShouldRetry(response.StatusCode))
                {
                    await Task.Delay(500, ct);
                    continue;
                }

                throw BuildOpenAIException(response.StatusCode, body);
            }
            catch (TaskCanceledException ex) when (!ct.IsCancellationRequested && attempt == 0)
            {
                _logger.LogWarning(ex, "OpenAI timeout, retrying once.");
            }
            catch (HttpRequestException ex) when (attempt == 0)
            {
                _logger.LogWarning(ex, "OpenAI request failed, retrying once.");
            }
        }

        throw new OpenAIServiceException(StatusCodes.Status503ServiceUnavailable, "OpenAI indisponivel apos retry.");
    }

    private static bool ShouldRetry(System.Net.HttpStatusCode statusCode)
        => statusCode is System.Net.HttpStatusCode.TooManyRequests or System.Net.HttpStatusCode.BadGateway
            or System.Net.HttpStatusCode.ServiceUnavailable or System.Net.HttpStatusCode.GatewayTimeout
            or System.Net.HttpStatusCode.InternalServerError;

    private static OpenAIServiceException BuildOpenAIException(System.Net.HttpStatusCode statusCode, string body)
    {
        var mappedStatus = statusCode switch
        {
            System.Net.HttpStatusCode.TooManyRequests => StatusCodes.Status503ServiceUnavailable,
            System.Net.HttpStatusCode.BadGateway => StatusCodes.Status502BadGateway,
            System.Net.HttpStatusCode.ServiceUnavailable => StatusCodes.Status503ServiceUnavailable,
            System.Net.HttpStatusCode.GatewayTimeout => StatusCodes.Status503ServiceUnavailable,
            _ when (int)statusCode >= 500 => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status502BadGateway
        };

        var trimmed = string.IsNullOrWhiteSpace(body) ? string.Empty : body.Trim();
        if (trimmed.Length > 2000) trimmed = trimmed[..2000] + "...";
        var detail = string.IsNullOrWhiteSpace(trimmed) ? string.Empty : $" Detalhes: {trimmed}";
        return new OpenAIServiceException(mappedStatus, $"OpenAI erro HTTP {(int)statusCode}.{detail}");
    }

    private static string ExtractOutputJson(string responseJson)
    {
        using var doc = JsonDocument.Parse(responseJson);
        if (doc.RootElement.TryGetProperty("output_text", out var outputTextElement)
            && outputTextElement.ValueKind == JsonValueKind.String)
        {
            return outputTextElement.GetString() ?? "{}";
        }

        if (doc.RootElement.TryGetProperty("output", out var outputElement) && outputElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in outputElement.EnumerateArray())
            {
                if (!item.TryGetProperty("content", out var contentElement) || contentElement.ValueKind != JsonValueKind.Array)
                    continue;

                foreach (var contentItem in contentElement.EnumerateArray())
                {
                    if (contentItem.TryGetProperty("type", out var typeElement)
                        && typeElement.GetString() == "output_text"
                        && contentItem.TryGetProperty("text", out var textElement)
                        && textElement.ValueKind == JsonValueKind.String)
                    {
                        return textElement.GetString() ?? "{}";
                    }
                }
            }
        }

        throw new OpenAIServiceException(StatusCodes.Status502BadGateway, "Resposta OpenAI sem output_text.");
    }

    private static object BuildOpenAIRequest(object snapshot, string model, bool includeReasons)
    {
        var reasonPart = includeReasons
            ? @"  ""reason"": ""Explique em 1 frase objetiva o motivo do score (somente se houver evidencia nos dados)."""
            : string.Empty;

        var schemaExample = $@"{{
  ""matches"": [
    {{
      ""vagaId"": ""GUID da vaga exatamente como recebido"",
      ""score"": 0{(includeReasons ? ",\n" + reasonPart : string.Empty)}
    }}
  ]
}}";

        var systemPrompt = "Voce avalia compatibilidade entre candidato e vagas. " +
                           "Recebera dados do candidato e uma lista de vagas. " +
                           "Atribua score 0-100 para cada vaga (0 = sem aderencia; 100 = muito aderente). " +
                           "Nao invente dados. Use apenas o que esta nos dados fornecidos. " +
                           "Se faltar informacao, reduza o score. " +
                           "Retorne SOMENTE JSON valido seguindo este schema exemplo: " + schemaExample +
                           " Ordene os matches por score decrescente.";

        return new
        {
            model,
            input = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = "Dados do candidato e vagas:\n" + JsonSerializer.Serialize(snapshot) }
            },
            text = new
            {
                format = new
                {
                    type = "json_object"
                }
            }
        };
    }

    private static IReadOnlyList<JobMatchItem> NormalizeMatches(
        IReadOnlyList<JobMatchItemDto>? items,
        bool includeReasons)
    {
        if (items is null || items.Count == 0)
            return Array.Empty<JobMatchItem>();

        var result = new List<JobMatchItem>();
        foreach (var item in items)
        {
            if (!Guid.TryParse(item.VagaId, out var vagaId))
                continue;

            var score = Clamp(item.Score);
            var reason = includeReasons ? item.Reason?.Trim() : null;
            result.Add(new JobMatchItem(vagaId, score, string.IsNullOrWhiteSpace(reason) ? null : reason));
        }

        return result
            .OrderByDescending(x => x.Score)
            .ToList();
    }

    private static int Clamp(JsonElement? element)
    {
        if (element is null) return 0;
        var value = element.Value;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var n))
            return Clamp(n);
        if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out var s))
            return Clamp(s);
        return 0;
    }

    private static int Clamp(int value)
        => value < 0 ? 0 : value > 100 ? 100 : value;

    private sealed class JobMatchResponseDto
    {
        [JsonPropertyName("matches")]
        public List<JobMatchItemDto>? Matches { get; set; }
    }

    private sealed class JobMatchItemDto
    {
        [JsonPropertyName("vagaId")]
        public string? VagaId { get; set; }

        [JsonPropertyName("score")]
        public JsonElement? Score { get; set; }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }
}
