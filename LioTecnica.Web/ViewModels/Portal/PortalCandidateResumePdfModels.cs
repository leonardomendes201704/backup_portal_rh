namespace LioTecnica.Web.ViewModels.Portal;

public sealed record PortalCandidateResumePdfResponse(
    string FileName,
    string ContentType,
    string Base64
);
