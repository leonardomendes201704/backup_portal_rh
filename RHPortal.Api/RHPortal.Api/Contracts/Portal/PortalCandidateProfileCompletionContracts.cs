using System.Text.Json.Serialization;

namespace RhPortal.Api.Contracts.Portal;

public sealed record PortalCandidateProfileCompletionSuggestion(
    [property: JsonPropertyName("section")] string Section,
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("impact")] string Impact
);

public sealed record PortalCandidateProfileCompletionResponse(
    [property: JsonPropertyName("sections")] IReadOnlyDictionary<string, int> Sections,
    [property: JsonPropertyName("overall")] int Overall,
    [property: JsonPropertyName("warnings")] IReadOnlyList<string>? Warnings = null,
    [property: JsonPropertyName("evidence")] IReadOnlyDictionary<string, string>? Evidence = null,
    [property: JsonPropertyName("suggestions")] IReadOnlyList<PortalCandidateProfileCompletionSuggestion>? Suggestions = null
);
