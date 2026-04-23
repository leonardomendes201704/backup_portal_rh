using System.Diagnostics;
using LioTecnica.PortalVagas.Web.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LioTecnica.PortalVagas.Web.Controllers;

public class HomeController : Controller
{
    public HomeController(ILogger<HomeController> logger) { }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    [AllowAnonymous]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
