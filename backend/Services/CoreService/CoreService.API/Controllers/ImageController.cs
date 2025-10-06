using CoreService.Application.Interfaces;
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

        public record UploadReq(string OwnerType, string OwnerId, string? Description);

        [HttpPost("image")]
        [RequestSizeLimit(20_000_000)]
        public async Task<IActionResult> Upload(
    IFormFile file, 
    [FromForm] UploadReq req)
        {
            var entity = await _app.UploadAsync(file, req.OwnerType, req.OwnerId, req.Description);
            return Created(entity.Url, new { id = entity.Id, url = entity.Url });
        }

        [HttpGet("by-owner")]
        public async Task<IActionResult> List([FromQuery] string ownerType, [FromQuery] string ownerId)
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
