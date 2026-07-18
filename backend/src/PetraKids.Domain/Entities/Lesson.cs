namespace PetraKids.Domain.Entities;

/// <summary>Lección bíblica, con hasta un archivo PDF por grupo de edad.</summary>
public class Lesson
{
    public int Id { get; set; }
    public int SectionId { get; set; }
    public Section Section { get; set; } = null!;
    /// <summary>Número de la lección dentro de su sección.</summary>
    public int Number { get; set; }
    public string Title { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public ICollection<LessonFile> Files { get; set; } = new List<LessonFile>();
}
