using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetraKids.Application.Dtos;
using PetraKids.Infrastructure.Data;

namespace PetraKids.Api.Controllers;

[ApiController]
[Route("api/age-groups")]
public class AgeGroupsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AgeGroupDto>>> GetAll(CancellationToken ct)
    {
        var ages = await db.AgeGroups
            .OrderBy(a => a.DisplayOrder)
            .Select(a => new AgeGroupDto(a.Id, a.Name, a.Code, a.MinAge, a.DisplayOrder))
            .ToListAsync(ct);
        return Ok(ages);
    }
}
