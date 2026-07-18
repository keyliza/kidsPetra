namespace PetraKids.Domain.Entities;

/// <summary>Archivo PDF de una lección para un grupo de edad concreto.</summary>
public class LessonFile
{
    public int Id { get; set; }
    public int LessonId { get; set; }
    public Lesson Lesson { get; set; } = null!;
    public int AgeGroupId { get; set; }
    public AgeGroup AgeGroup { get; set; } = null!;
    /// <summary>URL pública del PDF (Google Drive u otro).</summary>
    public string? Url { get; set; }
    /// <summary>Ruta en el servidor si el archivo se sube localmente. Reservado para uso futuro.</summary>
    public string? StoragePath { get; set; }
}
