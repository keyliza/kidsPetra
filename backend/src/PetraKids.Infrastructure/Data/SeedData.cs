using Microsoft.EntityFrameworkCore;
using PetraKids.Domain.Entities;

namespace PetraKids.Infrastructure.Data;

/// <summary>Datos semilla estáticos: grupos de edad y secciones iniciales.
/// El usuario admin se siembra en el arranque desde variables de entorno (ver DbInitializer).</summary>
public static class SeedData
{
    public static void Apply(ModelBuilder b)
    {
        b.Entity<AgeGroup>().HasData(
            new AgeGroup { Id = 1, Name = "Bebés (0+)", Code = "B", MinAge = 0, DisplayOrder = 1 },
            new AgeGroup { Id = 2, Name = "Menores de 5", Code = "M", MinAge = 3, DisplayOrder = 2 },
            new AgeGroup { Id = 3, Name = "Niños de 5 a 10", Code = "N", MinAge = 5, DisplayOrder = 3 },
            new AgeGroup { Id = 4, Name = "Adolescentes", Code = "A", MinAge = 11, DisplayOrder = 4 }
        );

        b.Entity<Section>().HasData(
            new Section { Id = 1, Name = "Antiguo Testamento", Slug = "antiguo-testamento", Color = "#F97316", Icon = "scroll", CodePrefix = "OT", DisplayOrder = 1 },
            new Section { Id = 2, Name = "Nuevo Testamento", Slug = "nuevo-testamento", Color = "#0EA5E9", Icon = "book-open", CodePrefix = "NT", DisplayOrder = 2 },
            new Section { Id = 3, Name = "Navidad", Slug = "navidad", Color = "#EF4444", Icon = "gift", CodePrefix = "NAV", DisplayOrder = 3 },
            new Section { Id = 4, Name = "Pascua", Slug = "pascua", Color = "#8B5CF6", Icon = "egg", CodePrefix = "PAS", DisplayOrder = 4 },
            new Section { Id = 5, Name = "El Espíritu Santo", Slug = "espiritu-santo", Color = "#10B981", Icon = "flame", CodePrefix = "ES", DisplayOrder = 5 }
        );
    }
}
