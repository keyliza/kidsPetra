using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetraKids.Application;
using PetraKids.Application.Dtos;
using PetraKids.Domain.Entities;
using PetraKids.Infrastructure.Data;

namespace PetraKids.Api.Controllers;

[ApiController]
[Route("api/sections")]
public class SectionsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SectionDto>>> GetAll(CancellationToken ct)
    {
        var sections = await db.Sections
            .OrderBy(s => s.DisplayOrder)
            .Select(s => new SectionDto(s.Id, s.Name, s.Slug, s.Color, s.Icon, s.CodePrefix, s.DisplayOrder, s.Lessons.Count))
            .ToListAsync(ct);
        return Ok(sections);
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpPost]
    public async Task<ActionResult<SectionDto>> Create(SectionInput input, CancellationToken ct)
    {
        var section = new Section
        {
            Name = input.Name.Trim(),
            Slug = Slugify(input.Slug, input.Name),
            Color = input.Color,
            Icon = input.Icon,
            CodePrefix = input.CodePrefix?.Trim().ToUpperInvariant() ?? "",
            DisplayOrder = input.DisplayOrder,
        };
        if (await db.Sections.AnyAsync(s => s.Slug == section.Slug, ct))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Ya existe una sección con ese slug.");

        db.Sections.Add(section);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetAll), new { id = section.Id }, section.ToDto());
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<SectionDto>> Update(int id, SectionInput input, CancellationToken ct)
    {
        var section = await db.Sections.FindAsync([id], ct);
        if (section is null) return NotFound();

        section.Name = input.Name.Trim();
        section.Slug = Slugify(input.Slug, input.Name);
        section.Color = input.Color;
        section.Icon = input.Icon;
        section.CodePrefix = input.CodePrefix?.Trim().ToUpperInvariant() ?? "";
        section.DisplayOrder = input.DisplayOrder;

        if (await db.Sections.AnyAsync(s => s.Slug == section.Slug && s.Id != id, ct))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Ya existe una sección con ese slug.");

        await db.SaveChangesAsync(ct);
        return Ok(section.ToDto());
    }

    [Authorize(Roles = UserRoles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var section = await db.Sections.FindAsync([id], ct);
        if (section is null) return NotFound();
        if (await db.Lessons.AnyAsync(l => l.SectionId == id, ct))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "No se puede eliminar: la sección tiene lecciones.");

        db.Sections.Remove(section);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static string Slugify(string? slug, string name)
    {
        var source = string.IsNullOrWhiteSpace(slug) ? name : slug;
        var normalized = source.Trim().ToLowerInvariant()
            .Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u").Replace("ñ", "n");
        var chars = normalized.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray();
        var result = new string(chars);
        while (result.Contains("--")) result = result.Replace("--", "-");
        return result.Trim('-');
    }
}
