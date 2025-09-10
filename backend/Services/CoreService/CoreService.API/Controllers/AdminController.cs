using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAdminApplication _adminApplication;

        public AdminController(IAdminApplication adminApplication)
        {
            _adminApplication = adminApplication;
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] AdminUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var response = await _adminApplication.UpdateAsync(dto, accountId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
