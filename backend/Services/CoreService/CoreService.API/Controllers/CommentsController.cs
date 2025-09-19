using CoreService.Application.DTOs.CommentDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [ApiController]
    [Route("api/comments")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentApplication _app;
        public CommentsController(ICommentApplication app) { _app = app; }

        // GET comments theo ParkingLot (cũ – nếu bạn đang dùng)
        [HttpGet("by-parkinglot/{parkingLotId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByParkingLot(string parkingLotId, [FromQuery] int? page, [FromQuery] int? pageSize)
            => Ok(await _app.GetByParkingLotAsync(parkingLotId, page, pageSize));

        // ✅ GET comments theo FAQ (mới)
        [HttpGet("by-faq/{faqId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByFaq(string faqId, [FromQuery] int? page, [FromQuery] int? pageSize)
            => Ok(await _app.GetByFaqAsync(faqId, page, pageSize));

        // Tạo comment (đa đích)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CommentCreateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.CreateAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> Update([FromBody] CommentUpdateDto dto)
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
    }
}
