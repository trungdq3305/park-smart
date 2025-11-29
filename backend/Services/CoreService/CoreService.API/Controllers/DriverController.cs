using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CoreService.API.Controllers
{
    [Route("api/drivers")]
    [ApiController]
    public class DriverController : ControllerBase
    {
        private readonly IDriverApplication _driverApplication;

        public DriverController(IDriverApplication driverApplication)
        {
            _driverApplication = driverApplication;
        }

        [HttpPut]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> Update([FromBody] DriverUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var response = await _driverApplication.UpdateAsync(dto, accountId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPatch("parking/credit-point")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> UpdateCreditPoint([FromBody] CreditPointUpdateDto dto)
        {
            // Lấy AccountId của người thực hiện hành động (Admin) từ token
            var modifierAccountId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(modifierAccountId))
            {
                // Đây không nên xảy ra nếu Authorize hoạt động đúng, nhưng là bảo vệ.
                return Unauthorized(new { Message = "Không có quyền thực hiện hành động này." });
            }

            // Gọi logic nghiệp vụ (Application Layer)
            var response = await _driverApplication.UpdateCreditPointAsync(
                dto.TargetAccountId, // AccountId của tài xế cần cập nhật
                dto.CreditPoint,
                modifierAccountId
            );

            return StatusCode(response.StatusCode, response);
        }
        public class CreditPointUpdateDto
        {
            public string TargetAccountId { get; set; } // AccountId của tài xế cần cập nhật
            public int CreditPoint { get; set; }
        }
    }
}
