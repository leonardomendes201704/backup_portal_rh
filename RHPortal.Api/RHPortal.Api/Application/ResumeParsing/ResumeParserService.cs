using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RhPortal.Api.Contracts.Candidates;
using UglyToad.PdfPig;

namespace RhPortal.Api.Application.ResumeParsing;

public sealed class ResumeParserService : IResumeParserService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenAIOptions _options;
    private readonly ILogger<ResumeParserService> _logger;

    public ResumeParserService(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAIOptions> options,
        ILogger<ResumeParserService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ResumeParsedDto> ParseAsync(IFormFile file, CancellationToken ct)
    {
        if (file is null) throw new ArgumentNullException(nameof(file));

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_options.AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Extensao de arquivo nao suportada.");
        }

        var extractedText = extension switch
        {
            ".pdf" => await ExtractPdfTextAsync(file),
            ".docx" => await ExtractDocxTextAsync(file),
            _ => string.Empty
        };

        if (string.IsNullOrWhiteSpace(extractedText))
        {
            return new ResumeParsedDto
            {
                Warnings = ["resume_text_empty"],
                MissingFields = ["candidate", "education", "experience", "skills", "certifications"]
            };
        }

        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException("OpenAI API key ausente.");
        }

        var requestPayload = BuildOpenAIRequest(extractedText, _options.Model);
        var json = JsonSerializer.Serialize(requestPayload, new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });

        var responseJson = await SendWithRetryAsync(json, ct);
        var outputJson = ExtractOutputJson(responseJson);
        var parsed = JsonSerializer.Deserialize<ResumeParsedDto>(outputJson, JsonOptions)
                     ?? new ResumeParsedDto();

        EnsureLists(parsed);
        return parsed;
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
                {
                    return body;
                }

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

    private static bool ShouldRetry(HttpStatusCode statusCode)
        => statusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.BadGateway
            or HttpStatusCode.ServiceUnavailable or HttpStatusCode.GatewayTimeout
            or HttpStatusCode.InternalServerError;

    private static OpenAIServiceException BuildOpenAIException(HttpStatusCode statusCode, string body)
    {
        var mappedStatus = statusCode switch
        {
            HttpStatusCode.TooManyRequests => StatusCodes.Status503ServiceUnavailable,
            HttpStatusCode.BadGateway => StatusCodes.Status502BadGateway,
            HttpStatusCode.ServiceUnavailable => StatusCodes.Status503ServiceUnavailable,
            HttpStatusCode.GatewayTimeout => StatusCodes.Status503ServiceUnavailable,
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
        if (doc.RootElement.TryGetProperty("output_text", out var outputTextElement) && outputTextElement.ValueKind == JsonValueKind.String)
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

    private static void EnsureLists(ResumeParsedDto dto)
    {
        dto.Candidate ??= new CandidateDto();
        dto.Education ??= [];
        dto.Experience ??= [];
        dto.Skills ??= [];
        dto.Certifications ??= [];
        dto.MissingFields ??= [];
        dto.Warnings ??= [];
        dto.Evidence ??= [];
    }

    private static object BuildOpenAIRequest(string resumeText, string model)
    {
        var candidateProps = new Dictionary<string, object>
        {
            ["name"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["email"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["phone"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["city"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["linkedin"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["summary"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } }
        };

        var educationProps = new Dictionary<string, object>
        {
            ["level"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["institution"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["course"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["start"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["end"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } }
        };

        var experienceProps = new Dictionary<string, object>
        {
            ["company"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["role"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["start"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["end"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } },
            ["description"] = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } }
        };

        var rootProps = new Dictionary<string, object>
        {
            ["candidate"] = new
            {
                type = "object",
                additionalProperties = false,
                properties = candidateProps,
                required = candidateProps.Keys.ToArray()
            },
            ["education"] = new
            {
                type = "array",
                items = new
                {
                    type = "object",
                    additionalProperties = false,
                    properties = educationProps,
                    required = educationProps.Keys.ToArray()
                }
            },
            ["experience"] = new
            {
                type = "array",
                items = new
                {
                    type = "object",
                    additionalProperties = false,
                    properties = experienceProps,
                    required = experienceProps.Keys.ToArray()
                }
            },
            ["skills"] = new { type = "array", items = new { type = "string" } },
            ["certifications"] = new { type = "array", items = new { type = "string" } },
            ["missing_fields"] = new { type = "array", items = new { type = "string" } },
            ["warnings"] = new { type = "array", items = new { type = "string" } },
            ["evidence"] = new
            {
                type = "object",
                additionalProperties = new { anyOf = new object[] { new { type = "string" }, new { type = "null" } } }
            }
        };

        var schemaExample = @"{
  ""candidate"": { ""name"": """", ""email"": """", ""phone"": """", ""city"": """", ""linkedin"": """", ""summary"": """" },
  ""education"": [ { ""level"": """", ""institution"": """", ""course"": """", ""start"": """", ""end"": """" } ],
  ""experience"": [ { ""company"": """", ""role"": """", ""start"": """", ""end"": """", ""description"": """" } ],
  ""skills"": [],
  ""certifications"": [],
  ""missing_fields"": [],
  ""warnings"": [],
  ""evidence"": { ""candidate.email"": """", ""experience[0].company"": """" }
}";

        var systemPrompt = "Voce e um parser de curriculos. Extraia apenas informacoes presentes no texto. " +
                           "Nao invente dados. Se nao encontrar um campo, retorne null ou string vazia ou lista vazia. " +
                           "Normalize datas como YYYY-MM quando possivel. Inclua missing_fields e warnings. " +
                           "Quando possivel, inclua evidence com trechos curtos que justificam campos principais. " +
                           "Retorne SOMENTE JSON valido seguindo este schema exemplo: " + schemaExample;

        var userPrompt = "Texto do curriculo:\n" + resumeText;

        return new
        {
            model,
            input = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
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

    private static async Task<string> ExtractPdfTextAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        using var document = PdfDocument.Open(stream);
        var builder = new StringBuilder();
        foreach (var page in document.GetPages())
        {
            builder.AppendLine(page.Text);
        }

        return builder.ToString();
    }

    private static async Task<string> ExtractDocxTextAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        using var doc = WordprocessingDocument.Open(stream, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body is null)
        {
            return string.Empty;
        }

        var builder = new StringBuilder();
        foreach (var paragraph in body.Descendants<Paragraph>())
        {
            var text = paragraph.InnerText;
            if (!string.IsNullOrWhiteSpace(text))
            {
                builder.AppendLine(text);
            }
        }

        return builder.ToString();
    }
}
