using System.ComponentModel.DataAnnotations;

namespace PetraKids.Application.Dtos;

public class LoginInput
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}

public class RefreshInput
{
    [Required] public string RefreshToken { get; set; } = string.Empty;
}

public record UserDto(int Id, string Email, string Role);

public record AuthResult(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt, UserDto User);
