using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;

namespace LioTecnica.PortalVagas.Web.Infrastructure.Security;

public sealed class ApiAuthenticationHandler : DelegatingHandler
{
    private const string TenantHeader = "X-Tenant-Id";

    private readonly IHttpContextAccessor _httpContextAccessor;

    public ApiAuthenticationHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        // Forward tenant and bearer token from the current portal session.
        if (httpContext?.User?.Identity?.IsAuthenticated == true)
        {
            var tenantId = httpContext.User.FindFirst("tenant")?.Value;
            if (!string.IsNullOrWhiteSpace(tenantId) && !request.Headers.Contains(TenantHeader))
            {
                request.Headers.TryAddWithoutValidation(TenantHeader, tenantId);
            }

            var token = httpContext.User.FindFirst("access_token")?.Value;
            if (!string.IsNullOrWhiteSpace(token) && request.Headers.Authorization is null)
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }
        }

        HttpResponseMessage response;
        try
        {
            response = await base.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            response = new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
            {
                RequestMessage = request,
                ReasonPhrase = "API unavailable",
                Content = new StringContent(ex.Message)
            };
        }

        if (response.StatusCode == HttpStatusCode.Unauthorized && httpContext is not null)
        {
            httpContext.Items["ApiUnauthorized"] = true;
        }

        return response;
    }
}
