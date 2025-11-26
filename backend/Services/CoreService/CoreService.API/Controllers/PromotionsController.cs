using CoreService.Application.DTOs.PromotionDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/promotions")]
    [ApiController]
    public class PromotionsController : ControllerBase
    {
        private readonly IPromotionApplication _app;

        public PromotionsController(IPromotionApplication app)
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
        [HttpGet("operator")]
        public async Task<IActionResult> GetByOperatorId(string operatorId)
        {
            

            var res = await _app.GetByOperatorIdAsync(operatorId);

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
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Create([FromBody] PromotionCreateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.CreateAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Update([FromBody] PromotionUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.UpdateAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> Delete(string id)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.DeleteAsync(id, accountId);
            return StatusCode(res.StatusCode, res);
        }

        // Rule management
        [HttpPost("rules")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> AddRule([FromBody] PromotionRuleCreateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.AddRuleAsync(dto, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("rules/{ruleId}")]
        [Authorize(Roles = "Admin,Operator")]
        public async Task<IActionResult> RemoveRule(string ruleId)
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.RemoveRuleAsync(ruleId, accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPost("calculate")]
        [AllowAnonymous]
        public async Task<IActionResult> Calculate([FromBody] PromotionCalculateRequestDto dto)
        {
            var res = await _app.CalculateAsync(dto);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPost("use")]
        [Authorize(Roles = "Driver,Admin,Operator")]
        public async Task<IActionResult> Use([FromBody] PromotionCalculateRequestDto dto)
        {
            var userId = User.FindFirst("id")?.Value;
            dto.AccountId = userId;

            var res = await _app.UsePromotionAsync(dto);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPost("refund")]
        [Authorize(Roles = "Admin,Operator,Driver")]
        public async Task<IActionResult> Refund(string entityId)
        {
            var actorAccountId = User.FindFirst("id")?.Value;
            var res = await _app.RefundPromotionUsageAsync(entityId, actorAccountId);
            return StatusCode(res.StatusCode, res);
        }
    }
}
