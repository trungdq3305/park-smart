using CoreService.Application.DTOs.FaqDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [ApiController]
    [Route("api/faqs")]
    public class FaqsController : ControllerBase
    {
        private readonly IFaqApplication _app;
        public FaqsController(IFaqApplication app) { _app = app; }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get([FromQuery] int? page, [FromQuery] int? pageSize)
            => Ok(await _app.GetPagedAsync(page, pageSize));

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
            => Ok(await _app.GetByIdAsync(id));

        [HttpPost]
        [Authorize(Roles = "Operator, Admin")] // tuỳ bạn: chỉ Admin/Operator?
        public async Task<IActionResult> Create([FromBody] FaqCreateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.CreateAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> Update([FromBody] FaqUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.UpdateAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.DeleteAsync(id, accountId);
            return StatusCode(res.StatusCode, res);
        }
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(string id)
        {
            var adminId = User.FindFirst("id")?.Value;
            var res = await _app.ApproveAsync(id, adminId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(FaqRejectDto dto)
        {
            var adminId = User.FindFirst("id")?.Value;
            var res = await _app.RejectAsync(dto, adminId);
            return StatusCode(res.StatusCode, res);
        }
        [HttpGet("by-status")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByStatus([FromQuery] string status, [FromQuery] int? page, [FromQuery] int? pageSize)
        {
            var res = await _app.GetByStatusAsync(status, page, pageSize);
            return StatusCode(res.StatusCode, res);
        }

        // GET /api/faqs/me?page=1&pageSize=10
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMine([FromQuery] int? page, [FromQuery] int? pageSize)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.GetMineAsync(accountId!, page, pageSize);
            return StatusCode(res.StatusCode, res);
        }
    }
}
