using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PetraKids.Application.Auth;
using PetraKids.Application.Import;
using PetraKids.Infrastructure.Auth;
using PetraKids.Infrastructure.Data;
using PetraKids.Infrastructure.Import;

namespace PetraKids.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Falta la cadena de conexión 'ConnectionStrings:Default'.");

        services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connectionString,
            sql => sql.EnableRetryOnFailure(maxRetryCount: 10, maxRetryDelay: TimeSpan.FromSeconds(6), errorNumbersToAdd: null)));

        var jwt = new JwtOptions();
        config.GetSection(JwtOptions.SectionName).Bind(jwt);
        if (string.IsNullOrWhiteSpace(jwt.Secret) || jwt.Secret.Length < 32)
            throw new InvalidOperationException("Jwt:Secret debe tener al menos 32 caracteres.");
        services.AddSingleton(jwt);

        services.AddScoped<TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IImportService, ImportService>();

        return services;
    }
}
