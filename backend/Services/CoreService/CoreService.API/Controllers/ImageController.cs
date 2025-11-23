using CoreService.Application.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/images")]
    [ApiController]
    public class ImageController : ControllerBase
    {
        private readonly IImageApplication _app;
        public ImageController(IImageApplication app) => _app = app;

        public record UploadReq(OwnerType OwnerType, string OwnerId, string? Description);
        [HttpPost("upload")]
        [RequestSizeLimit(20_000_000)]
        public async Task<IActionResult> Upload(
        IFormFile file,
        [FromForm] UploadReq req)
        {
            // Chuyển OwnerType enum cho tầng Application
            var entity = await _app.UploadAsync(file, req.OwnerType, req.OwnerId, req.Description);
            return Created(entity.Url, new { id = entity.Id, url = entity.Url });
        }

        [HttpGet("by-owner")]
        // CẬP NHẬT: Thay đổi tham số ownerType sang OwnerType enum
        public async Task<IActionResult> List([FromQuery] OwnerType ownerType, [FromQuery] string ownerId)
        {
            var items = await _app.GetByOwnerAsync(ownerType, ownerId);
            return Ok(items.Select(x => new { x.Id, x.Url, x.Description }));
        }

        [HttpDelete("image/{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ok = await _app.DeleteAsync(id);
            return ok ? Ok(new { deleted = id }) : NotFound();
        }
    }
}
