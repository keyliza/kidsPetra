using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using PetraKids.Application.Dtos;
using PetraKids.Application.Import;
using PetraKids.Domain.Entities;
using PetraKids.Infrastructure.Data;

namespace PetraKids.Infrastructure.Import;

/// <summary>Importa PDFs desde una lista pegada, detectando sección (por prefijo), número y edad
/// a partir del nombre del archivo. Patrones: "OT01 - 0+ bebes.pdf", "NT07 M.pdf".</summary>
public partial class ImportService(AppDbContext db) : IImportService
{
    // Prefijo (letras) + número, ej. "OT01", "NAV3".
    [GeneratedRegex(@"^([A-Za-z]+)\s*[-_ ]?0*(\d+)", RegexOptions.CultureInvariant)]
    private static partial Regex CodeRegex();

    public async Task<ImportResult> ImportAsync(ImportInput input, CancellationToken ct = default)
    {
        var sections = await db.Sections
            .Where(s => s.CodePrefix != "" && s.CodePrefix != null)
            .ToListAsync(ct);
        var ages = await db.AgeGroups.ToListAsync(ct);

        var rows = new List<ImportRowResult>();
        int created = 0, updated = 0, skipped = 0, lessonsCreated = 0;

        var lines = input.Text.Split('\n')
            .Select(l => l.Trim())
            .Where(l => l.Length > 0);

        foreach (var line in lines)
        {
            ct.ThrowIfCancellationRequested();
            var parsed = Parse(line, sections, ages);
            if (parsed.Error is not null)
            {
                skipped++;
                rows.Add(new ImportRowResult(line, false, null, null, null, parsed.Error));
                continue;
            }

            var (section, age, number, url, title) = parsed.Value!;

            if (input.DryRun)
            {
                rows.Add(new ImportRowResult(line, true, section.CodePrefix, number, age.Code, "Vista previa OK"));
                continue;
            }

            var lesson = await db.Lessons
                .Include(l => l.Files)
                .FirstOrDefaultAsync(l => l.SectionId == section.Id && l.Number == number, ct);

            if (lesson is null)
            {
                lesson = new Lesson
                {
                    SectionId = section.Id,
                    Number = number,
                    Title = title ?? $"Lección {number}",
                    DisplayOrder = number,
                };
                db.Lessons.Add(lesson);
                lessonsCreated++;
            }
            else if (title is not null && lesson.Title.StartsWith("Lección ", StringComparison.Ordinal))
            {
                lesson.Title = title; // completa título placeholder si llega uno mejor
            }

            var file = lesson.Files.FirstOrDefault(f => f.AgeGroupId == age.Id);
            if (file is null)
            {
                lesson.Files.Add(new LessonFile { AgeGroupId = age.Id, Url = url });
                created++;
                rows.Add(new ImportRowResult(line, true, section.CodePrefix, number, age.Code, "Creado"));
            }
            else
            {
                file.Url = url;
                updated++;
                rows.Add(new ImportRowResult(line, true, section.CodePrefix, number, age.Code, "Actualizado (URL reemplazada)"));
            }
        }

        if (!input.DryRun)
            await db.SaveChangesAsync(ct);

        return new ImportResult(created, updated, skipped, lessonsCreated, rows);
    }

    private record ParsedRow(Section Section, AgeGroup Age, int Number, string? Url, string? Title);

    private static (string? Error, ParsedRow? Value) Parse(
        string line, List<Section> sections, List<AgeGroup> ages)
    {
        var parts = line.Split('|').Select(p => p.Trim()).Where(p => p.Length > 0).ToList();
        var url = parts.FirstOrDefault(IsUrl);
        var nonUrl = parts.Where(p => !IsUrl(p)).ToList();

        // El "nombre" es la primera parte que contiene el patrón de código; si no hay, se deriva de la URL.
        string? name = nonUrl.FirstOrDefault(p => CodeRegex().IsMatch(p));
        if (name is null && url is not null)
            name = FileNameFromUrl(url);
        if (name is null)
            return ("No se encontró código de lección (ej. OT01) ni URL.", null);

        var m = CodeRegex().Match(name);
        if (!m.Success)
            return ($"No se pudo leer el código en «{name}».", null);

        var prefix = m.Groups[1].Value.ToUpperInvariant();
        var number = int.Parse(m.Groups[2].Value);

        var section = sections.FirstOrDefault(s =>
            string.Equals(s.CodePrefix, prefix, StringComparison.OrdinalIgnoreCase));
        if (section is null)
            return ($"Prefijo «{prefix}» no coincide con ninguna sección.", null);

        var age = DetectAge(name, ages);
        if (age is null)
            return ($"No se detectó el grupo de edad en «{name}».", null);

        // Título opcional: una parte no-URL que no es el nombre con código.
        var title = nonUrl.FirstOrDefault(p => p != name && !CodeRegex().IsMatch(p));

        return (null, new ParsedRow(section, age, number, url, title));
    }

    private static AgeGroup? DetectAge(string name, List<AgeGroup> ages)
    {
        var lower = name.ToLowerInvariant();
        string? code = null;
        if (Regex.IsMatch(lower, @"beb|0\s*\+")) code = "B";
        else if (Regex.IsMatch(lower, @"menor")) code = "M";
        else if (Regex.IsMatch(lower, @"adolesc")) code = "A";
        else if (Regex.IsMatch(lower, @"ni[ñn]|5\s*a\s*10")) code = "N";

        if (code is null)
        {
            // Letra suelta tras el código: "NT07 M", "NT07-A".
            var m = Regex.Match(name, @"\d+\s*[-_ ]\s*([BMNAbmna])\b");
            if (m.Success) code = m.Groups[1].Value.ToUpperInvariant();
        }

        return code is null ? null : ages.FirstOrDefault(a => a.Code == code);
    }

    private static bool IsUrl(string s) =>
        s.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
        s.StartsWith("https://", StringComparison.OrdinalIgnoreCase);

    private static string? FileNameFromUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return null;
        var last = uri.Segments.LastOrDefault()?.Trim('/');
        return string.IsNullOrWhiteSpace(last) ? null : Uri.UnescapeDataString(last);
    }
}
