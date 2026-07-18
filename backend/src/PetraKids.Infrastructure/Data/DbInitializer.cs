using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PetraKids.Domain.Entities;

namespace PetraKids.Infrastructure.Data;

/// <summary>Aplica migraciones pendientes y crea el usuario Admin inicial desde variables de entorno.</summary>
public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var db = sp.GetRequiredService<AppDbContext>();
        var config = sp.GetRequiredService<IConfiguration>();
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("DbInitializer");

        // El contenedor de SQL Server puede tardar en aceptar conexiones al arrancar.
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await db.Database.MigrateAsync();
                break;
            }
            catch (Exception ex) when (attempt < 15)
            {
                logger.LogWarning("Esperando a la base de datos (intento {Attempt}): {Message}", attempt, ex.Message);
                await Task.Delay(TimeSpan.FromSeconds(4));
            }
        }

        var email = config["ADMIN_EMAIL"]?.Trim();
        var password = config["ADMIN_PASSWORD"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("ADMIN_EMAIL / ADMIN_PASSWORD no configurados: no se creó el usuario admin.");
            return;
        }

        var normalized = email.ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == normalized))
            return;

        var user = new User { Email = normalized, Role = UserRoles.Admin };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        logger.LogInformation("Usuario admin creado: {Email}", normalized);
    }
}
