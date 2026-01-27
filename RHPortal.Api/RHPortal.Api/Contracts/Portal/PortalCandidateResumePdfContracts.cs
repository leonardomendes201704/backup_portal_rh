namespace RhPortal.Api.Contracts.Portal;

public sealed record PortalCandidateResumePdfResponse(
    string FileName,
    string ContentType,
    string Base64
);
