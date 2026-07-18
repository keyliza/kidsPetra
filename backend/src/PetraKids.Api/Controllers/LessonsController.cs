using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetraKids.Application;
using PetraKids.Application.Dtos;
using PetraKids.Domain.Entities;
using PetraKids.Infrastructure.Data;

namespace PetraKids.Api.Controllers;

[ApiController]
[Route("api/lessons")]
public class LessonsController(AppDbContext db) : ControllerBase
{
    private IQueryable<Lesson> BaseQuery() => db.Lessons
        .Include(l => l.Section)
        .Include(l => l.Files).ThenInclude(f => f.AgeGroup);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LessonDto>>> GetAll(
        [FromQuery] int? section, [FromQuery] int? age, [FromQuery] string? q, CancellationToken ct)
    {
        var query = BaseQuery();
        if (section is int sectionId) query = query.Where(l => l.SectionId == sectionId);
        if (age is int ageId) query = query.Where(l => l.Files.Any(f => f.AgeGroupId == ageId));
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(l => EF.Functions.Like(l.Title, $"%{term}%"));
        }

        var lessons = await query
            .OrderBy(l => l.Section.DisplayOrder).ThenBy(l => l.DisplayOrder).ThenBy(l => l.Number)
            .ToListAsync(ct);
        return Ok(lessons.Select(l => l.ToDto()));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LessonDto>> GetById(int id, CancellationToken ct)
    {
        var lesson = await BaseQuery().FirstOrDefaultAsync(l => l.Id == id, ct);
        return lesson is null ? NotFound() : Ok(lesson.ToDto());
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<LessonDto>> Create(LessonInput input, CancellationToken ct)
    {
        if (!await db.Sections.AnyAsync(s => s.Id == input.SectionId, ct))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "La sección indicada no existe.");

        var lesson = new Lesson
        {
            SectionId = input.SectionId,
            Number = input.Number,
            Title = input.Title.Trim(),
            DisplayOrder = input.DisplayOrder,
        };
        db.Lessons.Add(lesson);
        await db.SaveChangesAsync(ct);
        return await ReloadAndReturn(lesson.Id, ct);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<LessonDto>> Update(int id, LessonInput input, CancellationToken ct)
    {
        var lesson = await db.Lessons.FindAsync([id], ct);
        if (lesson is null) return NotFound();
        if (!await db.Sections.AnyAsync(s => s.Id == input.SectionId, ct))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "La sección indicada no existe.");

        lesson.SectionId = input.SectionId;
        lesson.Number = input.Number;
        lesson.Title = input.Title.Trim();
        lesson.DisplayOrder = input.DisplayOrder;
        await db.SaveChangesAsync(ct);
        return await ReloadAndReturn(lesson.Id, ct);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var lesson = await db.Lessons.FindAsync([id], ct);
        if (lesson is null) return NotFound();
        db.Lessons.Remove(lesson);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [Authorize]
    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder(List<ReorderItem> items, CancellationToken ct)
    {
        var ids = items.Select(i => i.Id).ToList();
        var lessons = await db.Lessons.Where(l => ids.Contains(l.Id)).ToListAsync(ct);
        foreach (var lesson in lessons)
            lesson.DisplayOrder = items.First(i => i.Id == lesson.Id).DisplayOrder;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Archivos por edad ---

    [Authorize]
    [HttpPut("{id:int}/files")]
    public async Task<ActionResult<LessonDto>> UpsertFile(int id, LessonFileInput input, CancellationToken ct)
    {
        var lesson = await db.Lessons.Include(l => l.Files).FirstOrDefaultAsync(l => l.Id == id, ct);
        if (lesson is null) return NotFound();
        if (!await db.AgeGroups.AnyAsync(a => a.Id == input.AgeGroupId, ct))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "El grupo de edad indicado no existe.");

        var file = lesson.Files.FirstOrDefault(f => f.AgeGroupId == input.AgeGroupId);
        if (file is null)
            lesson.Files.Add(new LessonFile { AgeGroupId = input.AgeGroupId, Url = input.Url?.Trim() });
        else
            file.Url = input.Url?.Trim();

        await db.SaveChangesAsync(ct);
        return await ReloadAndReturn(id, ct);
    }

    [Authorize]
    [HttpDelete("{id:int}/files/{ageGroupId:int}")]
    public async Task<IActionResult> DeleteFile(int id, int ageGroupId, CancellationToken ct)
    {
        var file = await db.LessonFiles.FirstOrDefaultAsync(f => f.LessonId == id && f.AgeGroupId == ageGroupId, ct);
        if (file is null) return NotFound();
        db.LessonFiles.Remove(file);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<ActionResult<LessonDto>> ReloadAndReturn(int id, CancellationToken ct)
    {
        var lesson = await BaseQuery().FirstAsync(l => l.Id == id, ct);
        return Ok(lesson.ToDto());
    }
}
