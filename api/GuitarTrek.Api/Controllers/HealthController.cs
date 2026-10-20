using GuitarTrek.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace GuitarTrek.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(AppDbContext db) : ControllerBase
{
    // GET /api/health → diz se a API está de pé e se alcança o banco.
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var database = await db.Database.CanConnectAsync();
        return Ok(new { status = "ok", database });
    }
}
