using Microsoft.AspNetCore.Http;
using RhPortal.Api.Contracts.Candidates;

namespace RhPortal.Api.Application.ResumeParsing;

public interface IResumeParserService
{
    Task<ResumeParsedDto> ParseAsync(IFormFile file, CancellationToken ct);
}
