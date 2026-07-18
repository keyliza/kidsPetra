using PetraKids.Application.Dtos;

namespace PetraKids.Application.Auth;

public interface IAuthService
{
    /// <summary>Devuelve tokens si las credenciales son válidas; null si no.</summary>
    Task<AuthResult?> LoginAsync(LoginInput input, CancellationToken ct = default);
    /// <summary>Rota el refresh token; null si es inválido o expiró.</summary>
    Task<AuthResult?> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}
