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
using static CoreService.Application.Applications.AuthApplication;

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
        [AllowAnonymous]
        public IActionResult GoogleLogin()
        {
            var state = Guid.NewGuid().ToString("N");
            _memoryCache.Set(state, true, TimeSpan.FromMinutes(10));

            var props = new AuthenticationProperties
            {
                RedirectUri = "/api/auths/google-callback"
            };
            return Challenge(props, GoogleDefaults.AuthenticationScheme);
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

        [HttpPost("register-confirm")]
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailByCodeRequest request)
        {
            var response = await _authApplication.ConfirmEmailAsync(request);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("register-resend-confirm")]
        public async Task<IActionResult> ResendConfirmation( string email)
        {
            var response = await _authApplication.ResendConfirmationAsync(email);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPut("confirm-operator")]
        [Authorize(Roles = "Admin")]
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

        [HttpPost("confirm-forgot-code")]
        public async Task<IActionResult> ConfirmForgotCode(ConfirmForgotCodeRequest request)
        {
            var response = await _authApplication.ConfirmForgotCodeAsync(request);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("confirm-forgot-pass")]
        public async Task<IActionResult> ConfirmForgotPass(ConfirmForgotPassRequest request)
        {
            var response = await _authApplication.ConfirmForgotPassAsync(request);
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
        [AllowAnonymous]
        public async Task<IActionResult> GoogleCallback()
        {
            // Lấy thông tin đăng nhập do middleware Google đã set vào cookie tạm
            var authenticateResult = await HttpContext.AuthenticateAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);

            if (!authenticateResult.Succeeded)
                return Unauthorized(new { message = "Authentication failed." });

            var claims = authenticateResult.Principal.Claims.ToList();
            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(email))
                return BadRequest(new { message = "Email not provided by Google." });

            // Tạo hoặc đăng nhập user trong hệ thống
            var response = await _authApplication.HandleGoogleLoginAsync(email, name);

            // (Tuỳ chọn) ký lại cookie để kéo dài session
            var claimsIdentity = new ClaimsIdentity(
                claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1)
            };
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);

            // Trả về JSON chứa thông tin / token
            return Ok(new
            {
                message = "Đăng nhập thành công, email:" + email + ", name:"+ name,
                data = response.Data
            });
        }

    }
}
