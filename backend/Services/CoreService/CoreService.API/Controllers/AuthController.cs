using CoreService.Application.Applications;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace KLTN.CoreService.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthApplication _authApplication;
        public AuthController(IAuthApplication authApplication)
        {
            _authApplication = authApplication;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var response = await _authApplication.LoginAsync(request);
            return StatusCode(response.StatusCode, response);
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
        [HttpGet("whoami")]
        public IActionResult WhoAmI()
        {
            return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
        }
    }
}
