using System.Globalization;
using LioTecnica.PortalVagas.Web.Infrastructure.ApiClients;
using LioTecnica.PortalVagas.Web.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc.Authorization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddLocalization(o => o.ResourcesPath = "Resources");

builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new AuthorizeFilter());
})
.AddViewLocalization()
.AddDataAnnotationsLocalization();

builder.Services.AddHttpContextAccessor();

var secureCookies = builder.Configuration.GetValue<bool?>("TransportSecurity:SecureCookies") ?? !builder.Environment.IsDevelopment();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/acesso";
        options.AccessDeniedPath = "/acesso";
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = secureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Lax;
    })
    .AddCookie(CandidateAuthDefaults.Scheme, options =>
    {
        options.LoginPath = "/acesso";
        options.AccessDeniedPath = "/acesso";
        options.SlidingExpiration = true;
        options.Cookie.Name = "PortalCandidato";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = secureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Lax;
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddTransient<ApiAuthenticationHandler>();

builder.Services.AddHttpClient<AuthApiClient>(http =>
{
    http.BaseAddress = new Uri(builder.Configuration["Endpoints:RhApi"]!);
}).AddHttpMessageHandler<ApiAuthenticationHandler>();

builder.Services.AddHttpClient<PortalAuthApiClient>(http =>
{
    http.BaseAddress = new Uri(builder.Configuration["Endpoints:RhApi"]!);
});

builder.Services.AddHttpClient<PortalCandidatesApiClient>(http =>
{
    http.BaseAddress = new Uri(builder.Configuration["Endpoints:RhApi"]!);
});

builder.Services.AddHttpClient<PortalLocationApiClient>(http =>
{
    http.BaseAddress = new Uri("https://brasilapi.com.br/");
});

builder.Services.AddHttpClient<HealthApiClient>(http =>
{
    http.BaseAddress = new Uri(builder.Configuration["Endpoints:RhApi"]!);
});

var app = builder.Build();
var useHsts = app.Configuration.GetValue<bool?>("TransportSecurity:UseHsts") ?? !app.Environment.IsDevelopment();
var useHttpsRedirection = app.Configuration.GetValue<bool?>("TransportSecurity:UseHttpsRedirection") ?? !app.Environment.IsDevelopment();

var supportedCultures = new[]
{
    new CultureInfo("pt-BR"),
    new CultureInfo("en-US")
};

var localizationOptions = new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture("pt-BR"),
    SupportedCultures = supportedCultures,
    SupportedUICultures = supportedCultures,
    RequestCultureProviders = new IRequestCultureProvider[]
    {
        new QueryStringRequestCultureProvider { QueryStringKey = "culture", UIQueryStringKey = "ui-culture" },
        new CookieRequestCultureProvider(),
        new AcceptLanguageHeaderRequestCultureProvider()
    }
};

app.UseRequestLocalization(localizationOptions);
app.UseForwardedHeaders();

app.UseExceptionHandler("/Home/Error");
if (useHsts)
{
    app.UseHsts();
}

if (useHttpsRedirection)
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseMiddleware<TenantValidationMiddleware>();
app.UseAuthorization();
app.UseMiddleware<ApiUnauthorizedMiddleware>();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=PortalVagas}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
