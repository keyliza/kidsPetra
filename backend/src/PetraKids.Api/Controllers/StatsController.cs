using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetraKids.Application.Dtos;
using PetraKids.Infrastructure.Data;

namespace PetraKids.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/stats")]
public class StatsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<StatsDto>> Get(CancellationToken ct)
    {
        var ages = await db.AgeGroups.OrderBy(a => a.DisplayOrder).ToListAsync(ct);
        var ageCount = ages.Count;

        var sections = await db.Sections
            .OrderBy(s => s.DisplayOrder)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Color,
                LessonCount = s.Lessons.Count,
                FileCount = s.Lessons.SelectMany(l => l.Files).Count(f => f.Url != null || f.StoragePath != null),
            })
            .ToListAsync(ct);

        var bySection = sections
            .Select(s => new SectionStatDto(s.Id, s.Name, s.Color, s.LessonCount, s.FileCount,
                Math.Max(0, s.LessonCount * ageCount - s.FileCount)))
            .ToList();

        var missingByAge = new List<AgeMissingDto>();
        var totalLessons = await db.Lessons.CountAsync(ct);
        foreach (var age in ages)
        {
            var present = await db.LessonFiles.CountAsync(
                f => f.AgeGroupId == age.Id && (f.Url != null || f.StoragePath != null), ct);
            missingByAge.Add(new AgeMissingDto(age.Id, age.Name, Math.Max(0, totalLessons - present)));
        }

        return Ok(new StatsDto(
            totalLessons,
            bySection.Sum(s => s.FileCount),
            sections.Count,
            bySection,
            missingByAge));
    }
}
