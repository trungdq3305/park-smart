using CoreService.Application.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static CoreService.Application.Applications.SubscriptionPlanApplication;

namespace CoreService.API.Controllers
{
    [Route("api/subscriptionplans")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Chỉ Admin mới được quản lý gói phí
    public class SubscriptionPlanController : ControllerBase
    {
        private readonly ISubscriptionPlanApplication _planApp;

        public SubscriptionPlanController(ISubscriptionPlanApplication planApp)
        {
            _planApp = planApp;
        }

        /// <summary>
        /// Lấy gói phí mặc định hiện tại.
        /// GET api/admin/subscription-plan
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<SubscriptionPlan>> GetDefaultPlan()
        {
            var plan = await _planApp.GetCurrentDefaultPlanAsync();
            return Ok(plan);
        }

        /// <summary>
        /// Cập nhật gói phí mặc định hiện tại.
        /// PUT api/admin/subscription-plan
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpdateDefaultPlan([FromBody] SubscriptionPlanUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _planApp.UpdateDefaultPlanAsync(dto);

            return NoContent(); // Trả về 204 No Content khi cập nhật thành công
        }
    }
}
