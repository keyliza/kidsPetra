using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetraKids.Application.Auth;
using PetraKids.Application.Dtos;

namespace PetraKids.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<AuthResult>> Login(LoginInput input, CancellationToken ct)
    {
        var result = await auth.LoginAsync(input, ct);
        return result is null
            ? Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Credenciales inválidas.")
            : Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResult>> Refresh(RefreshInput input, CancellationToken ct)
    {
        var result = await auth.RefreshAsync(input.RefreshToken, ct);
        return result is null
            ? Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Refresh token inválido o expirado.")
            : Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshInput input, CancellationToken ct)
    {
        await auth.LogoutAsync(input.RefreshToken, ct);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<UserDto> Me()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
        var email = User.FindFirstValue(ClaimTypes.Email) ?? "";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
        return Ok(new UserDto(id, email, role));
    }
}
