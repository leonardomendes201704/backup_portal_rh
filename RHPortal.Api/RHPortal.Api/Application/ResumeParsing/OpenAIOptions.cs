using System.ComponentModel.DataAnnotations;

namespace RhPortal.Api.Application.ResumeParsing;

public sealed class OpenAIOptions
{
    [Required]
    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.openai.com/v1/";

    public string Model { get; set; } = "gpt-4o-mini";

    public int TimeoutSeconds { get; set; } = 60;

    public long MaxFileSizeBytes { get; set; } = 10_485_760;

    public string[] AllowedExtensions { get; set; } = [".pdf", ".docx"];
}
