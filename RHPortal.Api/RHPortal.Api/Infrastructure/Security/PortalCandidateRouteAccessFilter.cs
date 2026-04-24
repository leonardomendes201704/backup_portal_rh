using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Localization;
using RhPortal.Api.Infrastructure.Localization;

namespace RhPortal.Api.Infrastructure.Security;

public sealed class PortalCandidateRouteAccessFilter : IAsyncActionFilter
{
    private readonly IStringLocalizer<InfrastructureMessages> _localizer;

    public PortalCandidateRouteAccessFilter(IStringLocalizer<InfrastructureMessages> localizer)
    {
        _localizer = localizer;
    }

    public Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!TryResolveRouteCandidateId(context, out var routeCandidateId))
        {
            return next();
        }

        var candidateClaim = context.HttpContext.User.FindFirstValue(PortalCandidateClaimConstants.CandidateId)
            ?? context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(candidateClaim, out var claimCandidateId) || claimCandidateId != routeCandidateId)
        {
            context.Result = new ObjectResult(new
            {
                message = _localizer["InfrastructureErrors.TenantDoesNotMatch"]
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };

            return Task.CompletedTask;
        }

        return next();
    }

    private static bool TryResolveRouteCandidateId(ActionExecutingContext context, out Guid candidateId)
    {
        candidateId = Guid.Empty;

        if (!context.RouteData.Values.TryGetValue("id", out var rawId) || rawId is null)
        {
            return false;
        }

        return Guid.TryParse(rawId.ToString(), out candidateId);
    }
}
