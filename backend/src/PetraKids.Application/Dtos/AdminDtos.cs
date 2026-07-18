using System.ComponentModel.DataAnnotations;

namespace PetraKids.Application.Dtos;

// --- Secciones ---
public class SectionInput
{
    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [MaxLength(140)] public string? Slug { get; set; }
    [Required, RegularExpression("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$", ErrorMessage = "Color hexadecimal inválido.")]
    public string Color { get; set; } = "#6366F1";
    [Required, MaxLength(60)] public string Icon { get; set; } = "book-open";
    [MaxLength(10)] public string? CodePrefix { get; set; }
    public int DisplayOrder { get; set; }
}

// --- Lecciones ---
public class LessonInput
{
    [Required] public int SectionId { get; set; }
    [Range(0, int.MaxValue)] public int Number { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public record ReorderItem(int Id, int DisplayOrder);

// --- Archivos por edad ---
public class LessonFileInput
{
    [Required] public int AgeGroupId { get; set; }
    [MaxLength(1000), Url(ErrorMessage = "URL inválida.")] public string? Url { get; set; }
}

// --- Estadísticas ---
public record SectionStatDto(int SectionId, string SectionName, string Color, int LessonCount, int FileCount, int MissingCount);
public record StatsDto(int TotalLessons, int TotalFiles, int TotalSections, IReadOnlyList<SectionStatDto> BySection, IReadOnlyList<AgeMissingDto> MissingByAge);
public record AgeMissingDto(int AgeGroupId, string AgeGroupName, int MissingCount);

// --- Importación masiva ---
public class ImportInput
{
    /// <summary>Lista de líneas: cada una una URL o "nombre.pdf | url".</summary>
    [Required] public string Text { get; set; } = string.Empty;
    /// <summary>Si es true, no persiste: solo devuelve la vista previa.</summary>
    public bool DryRun { get; set; }
}

public record ImportRowResult(string Source, bool Ok, string? SectionPrefix, int? Number, string? AgeCode, string Message);
public record ImportResult(int Created, int Updated, int Skipped, int LessonsCreated, IReadOnlyList<ImportRowResult> Rows);
