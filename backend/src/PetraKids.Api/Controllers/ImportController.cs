using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetraKids.Application.Dtos;
using PetraKids.Application.Import;

namespace PetraKids.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/import")]
public class ImportController(IImportService import) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ImportResult>> Import(ImportInput input, CancellationToken ct)
    {
        var result = await import.ImportAsync(input, ct);
        return Ok(result);
    }
}
