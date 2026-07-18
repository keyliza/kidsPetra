namespace PetraKids.Domain.Entities;

/// <summary>Grupo de edad (Bebés, Menores de 5, Niños 5-10, Adolescentes). Conjunto fijo sembrado.</summary>
public class AgeGroup
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    /// <summary>Código de una letra usado por el importador: B, M, N, A.</summary>
    public string Code { get; set; } = string.Empty;
    public int MinAge { get; set; }
    public int DisplayOrder { get; set; }

    public ICollection<LessonFile> Files { get; set; } = new List<LessonFile>();
}
