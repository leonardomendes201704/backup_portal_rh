using LioTecnica.Web.Infrastructure.ApiClients;
using LioTecnica.Web.ViewModels.Admin;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace LioTecnica.Web.ViewComponents;

public sealed class MainMenuViewComponent : ViewComponent
{
    private readonly MenusApiClient _menusApi;
    private readonly ILogger<MainMenuViewComponent> _logger;

    public MainMenuViewComponent(MenusApiClient menusApi, ILogger<MainMenuViewComponent> logger)
    {
        _menusApi = menusApi;
        _logger = logger;
    }

    public async Task<IViewComponentResult> InvokeAsync(string linkClass = "nav-link")
    {
        IReadOnlyList<MenuForCurrentUserViewModel> menus;
        try
        {
            menus = await _menusApi.ListForCurrentUserAsync(HttpContext.RequestAborted);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Nao foi possivel carregar o menu atual; renderizando menu vazio.");
            menus = Array.Empty<MenuForCurrentUserViewModel>();
        }

        ViewData["LinkClass"] = linkClass;
        return View(menus.OrderBy(x => x.Order).ToList());
    }
}
