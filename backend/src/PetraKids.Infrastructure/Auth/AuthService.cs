using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PetraKids.Application.Auth;
using PetraKids.Application.Dtos;
using PetraKids.Domain.Entities;
using PetraKids.Infrastructure.Data;

namespace PetraKids.Infrastructure.Auth;

public class AuthService(AppDbContext db, TokenService tokens, JwtOptions options) : IAuthService
{
    private readonly PasswordHasher<User> _hasher = new();

    public async Task<AuthResult?> LoginAsync(LoginInput input, CancellationToken ct = default)
    {
        var email = input.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null) return null;

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, input.Password);
        if (result == PasswordVerificationResult.Failed) return null;

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _hasher.HashPassword(user, input.Password);
            await db.SaveChangesAsync(ct);
        }

        return await IssueAsync(user, ct);
    }

    public async Task<AuthResult?> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var stored = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken, ct);

        if (stored is null || !stored.IsActive) return null;

        stored.RevokedAt = DateTime.UtcNow; // rotación
        var result = await IssueAsync(stored.User, ct);
        return result;
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == refreshToken, ct);
        if (stored is { RevokedAt: null })
        {
            stored.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task<AuthResult> IssueAsync(User user, CancellationToken ct)
    {
        var (access, accessExpires) = tokens.CreateAccessToken(user);
        var refresh = new RefreshToken
        {
            UserId = user.Id,
            Token = tokens.CreateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(options.RefreshTokenDays),
        };
        db.RefreshTokens.Add(refresh);
        await db.SaveChangesAsync(ct);

        return new AuthResult(access, refresh.Token, accessExpires,
            new UserDto(user.Id, user.Email, user.Role));
    }
}
