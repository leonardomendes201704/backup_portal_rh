using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using RhPortal.Api.Application.ResumeParsing;

namespace RhPortal.Api.Application.Portal;

public interface IProfileCompletionService
{
    Task<ProfileCompletionResult> ComputeAsync(object snapshot, CancellationToken ct);
}

public sealed record ProfileCompletionResult(
    IReadOnlyDictionary<string, int> Sections,
    int Overall,
    IReadOnlyList<string> Warnings,
    IReadOnlyDictionary<string, string> Evidence,
    IReadOnlyList<CompletionSuggestion> Suggestions);

public sealed record CompletionSuggestion(string Section, string Text, string Impact);

public sealed class ProfileCompletionService : IProfileCompletionService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenAIOptions _options;
    private readonly ILogger<ProfileCompletionService> _logger;

    public ProfileCompletionService(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAIOptions> options,
        ILogger<ProfileCompletionService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ProfileCompletionResult> ComputeAsync(object snapshot, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new InvalidOperationException("OpenAI API key ausente.");

        var requestPayload = BuildOpenAIRequest(snapshot, _options.Model);
        var json = JsonSerializer.Serialize(requestPayload, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        var responseJson = await SendWithRetryAsync(json, ct);
        var outputJson = ExtractOutputJson(responseJson);

        var parsed = JsonSerializer.Deserialize<CompletionResponseDto>(outputJson, JsonOptions)
                     ?? new CompletionResponseDto();

        var normalized = NormalizeSections(parsed.Sections);
        var overall = Clamp(parsed.Overall);
        var warnings = parsed.Warnings ?? [];
        var evidence = parsed.Evidence ?? new Dictionary<string, string>();
        var suggestions = parsed.Suggestions ?? [];

        return new ProfileCompletionResult(normalized, overall, warnings, evidence, suggestions);
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

    private static object BuildOpenAIRequest(object snapshot, string model)
    {
        var schemaExample = @"{
  ""sections"": {
    ""perfil"": 0,
    ""testes"": 0,
    ""comp"": 0,
    ""formacao"": 0,
    ""exp"": 0,
    ""lgpd"": 0,
    ""pref"": 0,
    ""docs"": 0,
    ""refs"": 0,
    ""acess"": 0,
    ""agenda"": 0,
    ""hist"": 0,
    ""notif"": 0
  },
  ""overall"": 0,
  ""warnings"": [],
  ""evidence"": {
    ""perfil"": ""ex: nome/email/telefone preenchidos"",
    ""exp"": ""ex: 3 experiencias com descricoes completas""
  },
  ""suggestions"": [
    { ""section"": ""exp"", ""text"": ""Adicione descricoes mais completas nas experiencias."", ""impact"": ""alta"" }
  ]
}";

        var systemPrompt = "Voce avalia preenchimento de perfil de candidato. " +
                           "Recebera dados das tabelas e deve calcular percentuais (0-100) por secao. " +
                           "Nao invente dados. Se nao houver dados suficientes, use 0. " +
                           "Aplique pesos de qualidade (ex.: descricoes completas valem mais). " +
                           "Inclua sugestoes com impacto (baixa|media|alta) para melhorar o score. " +
                           "Retorne SOMENTE JSON valido seguindo este schema exemplo: " + schemaExample;

        return new
        {
            model,
            input = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = "Dados do candidato:\n" + JsonSerializer.Serialize(snapshot) }
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

    private static Dictionary<string, int> NormalizeSections(IReadOnlyDictionary<string, JsonElement>? sections)
    {
        var keys = new[]
        {
            "perfil","testes","comp","formacao","exp","lgpd","pref","docs","refs","acess","agenda","hist","notif"
        };
        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var key in keys)
        {
            var value = sections?.TryGetValue(key, out var raw) == true ? raw : (JsonElement?)null;
            result[key] = Clamp(value);
        }
        return result;
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

    private sealed class CompletionResponseDto
    {
        [JsonPropertyName("sections")]
        public Dictionary<string, JsonElement>? Sections { get; set; }
        [JsonPropertyName("overall")]
        public JsonElement? Overall { get; set; }
        [JsonPropertyName("warnings")]
        public List<string>? Warnings { get; set; }
        [JsonPropertyName("evidence")]
        public Dictionary<string, string>? Evidence { get; set; }
        [JsonPropertyName("suggestions")]
        public List<CompletionSuggestion>? Suggestions { get; set; }
    }
}
