using LioTecnica.PortalVagas.Web.Infrastructure.ApiClients;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LioTecnica.PortalVagas.Web.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    private readonly HealthApiClient _healthApi;

    public HealthController(HealthApiClient healthApi)
    {
        _healthApi = healthApi;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var response = await _healthApi.GetRawAsync(ct);
        if (string.IsNullOrWhiteSpace(response.Content))
            return StatusCode((int)response.StatusCode);

        return new ContentResult
        {
            StatusCode = (int)response.StatusCode,
            ContentType = "application/json",
            Content = response.Content
        };
    }
}
