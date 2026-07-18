namespace PetraKids.Domain.Entities;

/// <summary>Usuario del panel de administración.</summary>
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    /// <summary>Rol del usuario: Admin o Editor.</summary>
    public string Role { get; set; } = UserRoles.Editor;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
}
