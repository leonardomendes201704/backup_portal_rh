using System.Text.Json.Serialization;

namespace RhPortal.Api.Contracts.Candidates;

public sealed class ResumeParsedDto
{
    [JsonPropertyName("candidate")]
    public CandidateDto Candidate { get; set; } = new();
    [JsonPropertyName("education")]
    public List<EducationDto> Education { get; set; } = [];
    [JsonPropertyName("experience")]
    public List<ExperienceDto> Experience { get; set; } = [];
    [JsonPropertyName("skills")]
    public List<string> Skills { get; set; } = [];
    [JsonPropertyName("certifications")]
    public List<string> Certifications { get; set; } = [];
    [JsonPropertyName("missing_fields")]
    public List<string> MissingFields { get; set; } = [];
    [JsonPropertyName("warnings")]
    public List<string> Warnings { get; set; } = [];
    [JsonPropertyName("evidence")]
    public Dictionary<string, string?> Evidence { get; set; } = [];
}

public sealed class CandidateDto
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
    [JsonPropertyName("city")]
    public string? City { get; set; }
    [JsonPropertyName("linkedin")]
    public string? Linkedin { get; set; }
    [JsonPropertyName("summary")]
    public string? Summary { get; set; }
}

public sealed class EducationDto
{
    [JsonPropertyName("level")]
    public string? Level { get; set; }
    [JsonPropertyName("institution")]
    public string? Institution { get; set; }
    [JsonPropertyName("course")]
    public string? Course { get; set; }
    [JsonPropertyName("start")]
    public string? Start { get; set; }
    [JsonPropertyName("end")]
    public string? End { get; set; }
}

public sealed class ExperienceDto
{
    [JsonPropertyName("company")]
    public string? Company { get; set; }
    [JsonPropertyName("role")]
    public string? Role { get; set; }
    [JsonPropertyName("start")]
    public string? Start { get; set; }
    [JsonPropertyName("end")]
    public string? End { get; set; }
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}
