using CoreService.Application.Applications;
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

        //[HttpGet("admin/account-stats")]
        //[Authorize(Roles = "Admin")]
        //public async Task<IActionResult> GetAdminAccountStats([FromQuery] int? page, [FromQuery] int? pageSize)
        //{
        //    // Luồng 1
        //    return Ok(await _accountApp.GetAllAsync(page, pageSize));
        //}

        [HttpGet("operator/payments")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetOperatorPayments(
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
                request.OperatorId,
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
        [HttpGet("operator/financial-totals")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetOperatorFinancialTotals(
            [FromQuery] OperatorDashboardRequest request)
        {
            // Chỉ tính các giao dịch Driver trả tiền cho Operator
            var operatorTypes = new[] { PaymentType.Reservation, PaymentType.Subscription, PaymentType.ParkingLotSession };

            var totals = await _paymentApp.GetPaymentTotalsAsync(
                request.OperatorId,
                operatorTypes,
                request.FromDate,
                request.ToDate);

            return Ok(totals);
        }

        /// <summary>
        /// Thống kê số lượng giao dịch theo Status (PAID, PENDING, EXPIRED,...)
        /// </summary>
        [HttpGet("operator/status-counts")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetOperatorPaymentStatusCounts(
            [FromQuery] OperatorDashboardRequest request)
        {
            // Chỉ tính các giao dịch Driver trả tiền cho Operator
            var operatorTypes = new[] { PaymentType.Reservation, PaymentType.Subscription, PaymentType.ParkingLotSession };

            var counts = await _paymentApp.GetPaymentCountByStatusAsync(
                request.OperatorId,
                operatorTypes,
                request.FromDate,
                request.ToDate);

            return Ok(counts);
        }
        [HttpGet("admin/payments")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminOperatorCharges(
                [FromQuery] OperatorDashboardRequest request)
        {
            // Lọc cứng PaymentType chỉ là OperatorCharge (OPR)
            var paymentTypes = new[] { PaymentType.OperatorCharge,
            PaymentType.PenaltyCharge };

            var records = await _paymentApp.GetOperatorPaymentsFilteredAsync(
                request.OperatorId, // Admin có thể lọc theo OperatorId cụ thể
                paymentTypes,
                request.Status,
                request.FromDate,
                request.ToDate);

            return Ok(records);
        }

        /// <summary>
        /// Tổng hợp doanh thu và Refund của các giao dịch OperatorCharge (phí thu từ Operator) cho Admin.
        /// </summary>
        [HttpGet("admin/financial-totals")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminFinancialTotals(
            [FromQuery] OperatorDashboardRequest request)
        {
            // Chỉ tính các giao dịch thu phí từ Operator (OPR)
            var adminTypes = new[] { PaymentType.OperatorCharge,
            PaymentType.PenaltyCharge  };

            var totals = await _paymentApp.GetPaymentTotalsAsync(
                request.OperatorId, // Admin có thể lọc theo OperatorId cụ thể
                adminTypes,
                request.FromDate,
                request.ToDate);

            return Ok(totals);
        }

        /// <summary>
        /// Thống kê số lượng giao dịch OperatorCharge theo Status cho Admin.
        /// </summary>
        [HttpGet("admin/status-counts")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminPaymentStatusCounts(
            [FromQuery] OperatorDashboardRequest request)
        {
            // Chỉ tính các giao dịch thu phí từ Operator (OPR)
            var adminTypes = new[] { PaymentType.OperatorCharge,
            PaymentType.PenaltyCharge  };

            var counts = await _paymentApp.GetPaymentCountByStatusAsync(
                request.OperatorId, // Admin có thể lọc theo OperatorId cụ thể
                adminTypes,
                request.FromDate,
                request.ToDate);

            return Ok(counts);
        }

        [HttpGet("account-stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var response = await _accountApp.GetDashboardStatsAsync();
            return StatusCode(response.StatusCode, response);
        }

        // 🌟 API MỚI 2: Số lượng đăng ký mới theo Role và Khoảng thời gian
        // GET api/accounts/new-registrations?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
        [HttpGet("new-registrations")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetNewRegistrationsByRole(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            // ... (Kiểm tra startDate/endDate) ...
            var response = await _accountApp.GetNewRegistrationsByRoleAsync(startDate, endDate);
            return StatusCode(response.StatusCode, response);
        }
    }
}
