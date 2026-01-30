using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using RhPortal.Api.Application.ResumeParsing;
using RhPortal.Api.Contracts.Candidates;

namespace RhPortal.Api.Controllers;

[ApiController]
[Route("api/candidate")]
public sealed class CandidateController : ControllerBase
{
    private readonly IResumeParserService _resumeParserService;
    private readonly OpenAIOptions _options;
    private readonly ILogger<CandidateController> _logger;

    public CandidateController(
        IResumeParserService resumeParserService,
        IOptions<OpenAIOptions> options,
        ILogger<CandidateController> logger)
    {
        _resumeParserService = resumeParserService;
        _options = options.Value;
        _logger = logger;
    }

    [HttpPost("upload-resume")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ResumeParsedDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<ResumeParsedDto>> UploadResume(
        [FromForm] IFormFile? file,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Arquivo nao informado." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_options.AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Extensao de arquivo invalida. Use PDF ou DOCX." });
        }

        if (file.Length > _options.MaxFileSizeBytes)
        {
            return StatusCode(StatusCodes.Status413PayloadTooLarge, new { message = "Arquivo excede o tamanho maximo." });
        }

        LogFileFingerprint(file);

        try
        {
            var parsed = await _resumeParserService.ParseAsync(file, ct);

            // TODO: Persistir Candidate/Education/Experience/Skills/Certifications no banco via EF Core.

            return Ok(parsed);
        }
        catch (OpenAIServiceException ex)
        {
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado no upload de curriculo.");
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: "Erro inesperado.");
        }
    }

    private void LogFileFingerprint(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(stream);
        var hashHex = Convert.ToHexString(hash);

        _logger.LogInformation(
            "Resume upload recebido. FileName={FileName} SizeBytes={SizeBytes} Sha256={Sha256}",
            file.FileName,
            file.Length,
            hashHex);
    }
}
