using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.DashboardDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/dashboards")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IAccountApplication _accountApp;
        private readonly IPaymentApp _paymentApp;
        // ... Khai báo Repository/Application khác

        public DashboardController(IAccountApplication accountApp, IPaymentApp paymentApp /* ... */)
        {
            _accountApp = accountApp;
            _paymentApp = paymentApp;
            // ...
        }

        // --- ADMIN DASHBOARD ---

        [HttpGet("admin/account-stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminAccountStats([FromQuery] int? page, [FromQuery] int? pageSize)
        {
            // Luồng 1
            return Ok(await _accountApp.GetAllAsync(page, pageSize));
        }

        //[HttpGet("admin/saas-revenue/detail")]
        //[Authorize(Roles = "Admin")]
        //public async Task<IActionResult> GetSaasRevenueDetail([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        //{
        //    // Luồng 2 (Cần triển khai GetSaasRevenueForAdminAsync trong PaymentApp)
        //    var result = await _paymentApp.GetSaasRevenueForAdminAsync(from, to);
        //    return Ok(new ApiResponse<IEnumerable<SaasRevenueDetailDto>>(result, true, "Thành công", StatusCodes.Status200OK));
        //}

        //// --- OPERATOR DASHBOARD ---

        //[HttpGet("operator/driver-revenue/detail")]
        //[Authorize(Roles = "Operator")]
        //public async Task<IActionResult> GetOperatorDriverRevenueDetail([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        //{
        //    // Luồng 3
        //    var operatorId = User.FindFirst("roleId")?.Value;
        //    if (string.IsNullOrEmpty(operatorId)) return Forbid();

        //    // (Cần triển khai GetDriverRevenueForOperatorAsync trong PaymentApp)
        //    var result = await _paymentApp.GetDriverRevenueForOperatorAsync(operatorId, from, to);
        //    return Ok(new ApiResponse<IEnumerable<DriverRevenueDetailDto>>(result, true, "Thành công", StatusCodes.Status200OK));
        //}
    }
}
