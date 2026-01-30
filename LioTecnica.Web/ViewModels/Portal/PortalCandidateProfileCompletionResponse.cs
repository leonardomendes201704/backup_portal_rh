using System.Text.Json.Serialization;

namespace LioTecnica.Web.ViewModels.Portal;

public sealed record PortalCandidateProfileCompletionSuggestion(
    [property: JsonPropertyName("section")] string Section,
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("impact")] string Impact
);

public sealed record PortalCandidateProfileCompletionResponse(
    [property: JsonPropertyName("sections")] IReadOnlyDictionary<string, int> Sections,
    [property: JsonPropertyName("overall")] int Overall,
    [property: JsonPropertyName("warnings")] IReadOnlyList<string>? Warnings,
    [property: JsonPropertyName("evidence")] IReadOnlyDictionary<string, string>? Evidence,
    [property: JsonPropertyName("suggestions")] IReadOnlyList<PortalCandidateProfileCompletionSuggestion>? Suggestions
);
