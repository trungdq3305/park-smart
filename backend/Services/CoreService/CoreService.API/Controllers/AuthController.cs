using CoreService.Application.Applications;
using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace KLTN.CoreService.API.Controllers
{
    [Route("api/auths")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthApplication _authApplication;
        private readonly IMemoryCache _memoryCache;
        public AuthController(IAuthApplication authApplication, IMemoryCache memoryCache)
        {
            _authApplication = authApplication;
            _memoryCache = memoryCache;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var response = await _authApplication.LoginAsync(request);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("google-login")]
        public IActionResult GoogleLogin()
        {
            var state = Guid.NewGuid().ToString("N");
            _memoryCache.Set(state, true, TimeSpan.FromMinutes(10));

            var redirectUrl = Url.Action("GoogleCallback", "Auth");

            var properties = new AuthenticationProperties
            {
                RedirectUri = redirectUrl,
                Items = { { "state", state } }
            };

            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }
        [HttpPost("driver-register")]
        public async Task<IActionResult> DriverRegister(DriverRegisterRequest request)
        {
            var response = await _authApplication.DriverRegisterAsync(request);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("operator-register")]
        public async Task<IActionResult> OperatorRegister(OperatorRegisterRequest request)
        {
            var response = await _authApplication.OperatorRegisterAsync(request);
            return StatusCode(response.StatusCode, response);
        }
        
        [HttpPost("admin-create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAdmin(CreateAdminRequest request)
        {
            var response = await _authApplication.CreateAdminAsync(request);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("register-confirm")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
        {
            var response = await _authApplication.ConfirmEmailAsync(token);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("register-resend-confirm")]
        public async Task<IActionResult> ResendConfirmation( string email)
        {
            var response = await _authApplication.ResendConfirmationAsync(email);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("confirm-operator")]
        public async Task<IActionResult> ConfirmOperator(string id)
        {
            var response = await _authApplication.ConfirmOperatorAsync(id);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(string email)
        {
            var response = await _authApplication.ForgotPasswordAsync(email);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("confirm-forgot")]
        public async Task<IActionResult> ConfirmForgot(ConfirmForgotRequest request)
        {
            var response = await _authApplication.ConfirmForgotAsync(request);
            return StatusCode(response.StatusCode, response);
        }
        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var response = await _authApplication.ChangePasswordAsync(accountId, dto);
            return StatusCode(response.StatusCode, response);
        }
        [HttpGet("google-callback")]
        public async Task<IActionResult> GoogleCallback()
        {
            // Đọc thông tin từ Cookie (middleware đã set)
            var authenticateResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            if (!authenticateResult.Succeeded)
                return Unauthorized("Authentication failed.");

            var claims = authenticateResult.Principal.Claims.ToList();
            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(email))
                return BadRequest("Email not provided by Google");

            // Xử lý đăng nhập / tạo account nếu cần
            var response = await _authApplication.HandleGoogleLoginAsync(email, name);

            // Nếu login thành công, tạo URL để frontend redirect
            // Ví dụ: gửi token qua query string
            var frontendUrl = $"http://localhost:3000/login-success?token={response.Data}";

            // Optionally: re-sign cookie để extend session
            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1)
            };
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties
            );

            // Trả về JSON chứa URL
            return Redirect(frontendUrl);
        }


    }
}
