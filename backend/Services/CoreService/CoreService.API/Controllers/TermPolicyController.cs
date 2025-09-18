using CoreService.Application.DTOs.TermPolicyDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/termpolicies")]
    [ApiController]
    public class TermPolicyController : ControllerBase
    {
        private readonly ITermPolicyApplication _app;

        public TermPolicyController(ITermPolicyApplication app)
        {
            _app = app;
        }

        // Public: xem danh sách / xem chi tiết
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var res = await _app.GetAllAsync();
            return StatusCode(res.StatusCode, res);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
        {
            var res = await _app.GetByIdAsync(id);
            return StatusCode(res.StatusCode, res);
        }

        [HttpGet("by-admin/{cityAdminId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByAdmin(string cityAdminId)
        {
            var res = await _app.GetByAdminAsync(cityAdminId);
            return StatusCode(res.StatusCode, res);
        }

        // Admin: tạo/sửa/xoá
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] TermPolicyCreateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.CreateAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] TermPolicyUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.UpdateAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.DeleteAsync(id, accountId);
            return StatusCode(res.StatusCode, res);
        }
    }
}
