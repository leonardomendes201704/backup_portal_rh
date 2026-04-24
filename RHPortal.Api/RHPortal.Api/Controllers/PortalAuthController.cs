using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using RhPortal.Api.Application.Portal;
using RhPortal.Api.Contracts.Portal;
using RhPortal.Api.Infrastructure.Localization;
using RhPortal.Api.Infrastructure.Security;

namespace RhPortal.Api.Controllers;

/// <summary>
/// Autenticacao publica do candidato (Portal de Vagas).
/// </summary>
[ApiController]
[Route("api/public/portal-auth")]
public sealed class PortalAuthController : ControllerBase
{
    private readonly IStringLocalizer<ControllerMessages> _localizer;

    public PortalAuthController(IStringLocalizer<ControllerMessages> localizer)
    {
        _localizer = localizer;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PortalCandidateSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PortalCandidateSessionResponse>> Login(
        [FromBody] PortalCandidateLoginRequest request,
        [FromServices] IPortalCandidateAuthService service,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var response = await service.LoginAsync(request, Request.Headers.UserAgent.ToString(), ct);
        if (response is null)
            return Unauthorized(new { message = _localizer["ControllerErrors.PortalInvalidCredentials"] });

        return Ok(response);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PortalCandidateSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PortalCandidateSessionResponse>> Register(
        [FromBody] PortalCandidateRegisterRequest request,
        [FromServices] IPortalCandidateAuthService service,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var response = await service.RegisterAsync(request, Request.Headers.UserAgent.ToString(), ct);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PortalCandidateSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PortalCandidateSessionResponse>> Refresh(
        [FromBody] PortalCandidateRefreshRequest request,
        [FromServices] IPortalCandidateAuthService service,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var response = await service.RefreshAsync(request, Request.Headers.UserAgent.ToString(), ct);
        if (response is null)
            return Unauthorized(new { message = _localizer["ControllerErrors.PortalInvalidCredentials"] });

        return Ok(response);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = PortalCandidateClaimConstants.PolicyName)]
    [HttpGet("me")]
    [ProducesResponseType(typeof(PortalCandidateIdentityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PortalCandidateIdentityResponse>> Me(
        [FromServices] IPortalCandidateAuthService service,
        CancellationToken ct)
    {
        var rawCandidateId = User.FindFirstValue(PortalCandidateClaimConstants.CandidateId)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(rawCandidateId, out var candidateId))
            return Unauthorized(new { message = _localizer["ControllerErrors.PortalInvalidCredentials"] });

        var response = await service.GetCurrentAsync(candidateId, ct);
        if (response is null)
            return Unauthorized(new { message = _localizer["ControllerErrors.PortalInvalidCredentials"] });

        return Ok(response);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = PortalCandidateClaimConstants.PolicyName)]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(
        [FromBody] PortalCandidateLogoutRequest? request,
        [FromServices] IPortalCandidateAuthService service,
        CancellationToken ct)
    {
        var rawCandidateId = User.FindFirstValue(PortalCandidateClaimConstants.CandidateId)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(rawCandidateId, out var candidateId))
            return Unauthorized(new { message = _localizer["ControllerErrors.PortalInvalidCredentials"] });

        await service.LogoutAsync(candidateId, request ?? new PortalCandidateLogoutRequest(null), ct);
        return NoContent();
    }
}
