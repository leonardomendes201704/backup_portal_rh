using System.Text.Json.Serialization;

namespace LioTecnica.PortalVagas.Web.ViewModels.Portal;

public sealed record PortalCandidateJobMatchItem(
    [property: JsonPropertyName("vagaId")] Guid VagaId,
    [property: JsonPropertyName("score")] int Score,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("area")] string? Area,
    [property: JsonPropertyName("city")] string? City,
    [property: JsonPropertyName("uf")] string? Uf,
    [property: JsonPropertyName("mode")] string? Mode,
    [property: JsonPropertyName("level")] string? Level,
    [property: JsonPropertyName("reason")] string? Reason);

public sealed record PortalCandidateJobMatchResponse(
    [property: JsonPropertyName("matches")] IReadOnlyList<PortalCandidateJobMatchItem> Matches);
