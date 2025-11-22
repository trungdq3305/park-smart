using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.DashboardDtos;
using CoreService.Application.DTOs.PaymentDtos;
using CoreService.Application.DTOs.PaymentDtos.CoreService.Application.DTOs.PaymentDtos;
using CoreService.Application.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static CoreService.Application.Applications.PaymentApp;

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
        [HttpGet("operator/{operatorId}/payments")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetOperatorPayments(
    string operatorId,
    [FromQuery] OperatorDashboardRequest request)
        {
            // Tùy chọn: nếu là Operator thì dùng operatorId từ token
            // var currentUserId = User.FindFirst("id")?.Value;
            // if (User.IsInRole("Operator") && currentUserId != operatorId)
            //     return Forbid();

            var paymentTypes = request.PaymentType != null
        ? new[] { (PaymentType)Enum.Parse(typeof(PaymentType), request.PaymentType) }
        : null;

            // Sửa đổi kiểu trả về tại đây:
            var records = await _paymentApp.GetOperatorPaymentsFilteredAsync(
                operatorId,
                paymentTypes,
                request.Status,
                request.FromDate,
                request.ToDate);

            // Trả về DTO mới
            return Ok(records);
        }

        /// <summary>
        /// Tổng hợp doanh thu và Refund của Operator
        /// </summary>
        [HttpGet("operator/{operatorId}/financial-totals")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetOperatorFinancialTotals(
            string operatorId,
            [FromQuery] OperatorDashboardRequest request)
        {
            // Chỉ tính các giao dịch Driver trả tiền cho Operator
            var operatorTypes = new[] { PaymentType.Reservation, PaymentType.Subscription, PaymentType.ParkingLotSession };

            var totals = await _paymentApp.GetPaymentTotalsAsync(
                operatorId,
                operatorTypes,
                request.FromDate,
                request.ToDate);

            return Ok(totals);
        }

        /// <summary>
        /// Thống kê số lượng giao dịch theo Status (PAID, PENDING, EXPIRED,...)
        /// </summary>
        [HttpGet("operator/{operatorId}/status-counts")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetOperatorPaymentStatusCounts(
            string operatorId,
            [FromQuery] OperatorDashboardRequest request)
        {
            // Chỉ tính các giao dịch Driver trả tiền cho Operator
            var operatorTypes = new[] { PaymentType.Reservation, PaymentType.Subscription, PaymentType.ParkingLotSession };

            var counts = await _paymentApp.GetPaymentCountByStatusAsync(
                operatorId,
                operatorTypes,
                request.FromDate,
                request.ToDate);

            return Ok(counts);
        }
    }
}
