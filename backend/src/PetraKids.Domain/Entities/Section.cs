namespace PetraKids.Domain.Entities;

/// <summary>Sección de la biblioteca (Antiguo Testamento, Navidad, etc.).</summary>
public class Section
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    /// <summary>Color de la sección en hexadecimal, ej. "#F97316".</summary>
    public string Color { get; set; } = "#6366F1";
    /// <summary>Nombre del ícono (Lucide) usado en el frontend.</summary>
    public string Icon { get; set; } = "book-open";
    /// <summary>Prefijo de código usado por el importador para detectar la sección (OT, NT, NAV...).</summary>
    public string CodePrefix { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}
