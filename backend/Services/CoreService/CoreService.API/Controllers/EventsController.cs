using CoreService.Application.DTOs.EventDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CoreService.API.Controllers
{
    [Route("api/events")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly IEventApplication _app;

        public EventsController(IEventApplication app)
        {
            _app = app;
        }

        // Public endpoints
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var res = await _app.GetAllAsync();
            return StatusCode(res.StatusCode, res);
        }
        [HttpGet("me")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByCreatedby()
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.GetByAccIdAsync(accountId);
            return StatusCode(res.StatusCode, res);
        }
        [HttpGet("upcoming")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUpcoming()
        {
            var res = await _app.GetUpcomingAsync();
            return StatusCode(res.StatusCode, res);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
        {
            var res = await _app.GetByIdAsync(id);
            return StatusCode(res.StatusCode, res);
        }

        // Admin/Operator endpoints
        [HttpPost]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Create([FromBody] EventCreateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            // Nếu role vẫn là null, hãy thử lấy tất cả các claim để debug
            if (string.IsNullOrEmpty(role))
            {
                // Thử lấy claim bằng tên "role" mà không có ánh xạ
                role = User.FindFirst("role")?.Value;
            }
            var res = await _app.CreateAsync(dto, accountId, role);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Update([FromBody] EventUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var role = User.FindFirst("role")?.Value;
            var res = await _app.UpdateAsync(dto, accountId, role);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Delete(string id)
        {
            var accountId = User.FindFirst("id")?.Value;
            var role = User.FindFirst("role")?.Value;
            var res = await _app.DeleteAsync(id, accountId, role);
            return StatusCode(res.StatusCode, res);
        }
    }
}
