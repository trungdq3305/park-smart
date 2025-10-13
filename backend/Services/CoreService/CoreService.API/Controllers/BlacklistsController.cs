using CoreService.Application.DTOs.BlacklistDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/blacklists")]
    [ApiController]
    public class BlacklistsController : ControllerBase
    {
        private readonly IBlacklistApplication _app;

        public BlacklistsController(IBlacklistApplication app)
        {
            _app = app;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var res = await _app.GetAllAsync();
            return StatusCode(res.StatusCode, res);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> GetById(string id)
        {
            var res = await _app.GetByIdAsync(id);
            return StatusCode(res.StatusCode, res);
        }

        [HttpGet("by-operator/{operatorId}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> GetByOperatorId(string operatorId)
        {
            var res = await _app.GetByOperatorIdAsync(operatorId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPost]
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Create([FromBody] BlacklistCreateDto dto)
        {
            var operatorId = User.FindFirst("id")?.Value;
            var res = await _app.CreateAsync(dto, operatorId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut]
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Update([FromBody] BlacklistUpdateDto dto)
        {
            var operatorId = User.FindFirst("id")?.Value;
            var res = await _app.UpdateAsync(dto, operatorId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Delete(string id)
        {
            var operatorId = User.FindFirst("id")?.Value;
            var res = await _app.DeleteAsync(id, operatorId);
            return StatusCode(res.StatusCode, res);
        }
    }
}
