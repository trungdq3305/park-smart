using CoreService.Application.DTOs.FavouriteDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/favourites")]
    [ApiController]
    [Authorize(Roles = "Driver")]
    public class FavouritesController : ControllerBase
    {
        private readonly IFavouriteParkingLotApplication _app;

        public FavouritesController(IFavouriteParkingLotApplication app)
        {
            _app = app;
        }

        [HttpGet("my-favourites")]
        public async Task<IActionResult> GetMyFavourites()
        {
            var driverId = User.FindFirst("id")?.Value;
            var res = await _app.GetMyFavouritesAsync(driverId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] FavouriteCreateDto dto)
        {
            var driverId = User.FindFirst("id")?.Value;
            var res = await _app.CreateAsync(dto, driverId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("{parkingLotId}")]
        public async Task<IActionResult> Delete(string parkingLotId)
        {
            var driverId = User.FindFirst("id")?.Value;
            var res = await _app.DeleteAsync(parkingLotId, driverId);
            return StatusCode(res.StatusCode, res);
        }
    }
}
