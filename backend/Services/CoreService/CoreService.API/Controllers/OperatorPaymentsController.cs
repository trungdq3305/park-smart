using CoreService.Application.Applications;
using CoreService.Application.DTOs.PaymentDtos;
using CoreService.Application.DTOs.PaymentDtos.CoreService.Application.DTOs.PaymentDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.PaymentHelper;
using Dotnet.Shared.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CoreService.API.Controllers
{
    [Route("api/operators/payments")]
    [ApiController]
    public class OperatorPaymentsController : ControllerBase
    {
        private readonly IXenditPlatformService _platform;
        private readonly IPaymentApp _payment;
        private readonly IOptions<XenditOptions> _opt;
        private readonly IBillingService _billingService ;

        public OperatorPaymentsController(IXenditPlatformService platform, IPaymentApp payment, IOptions<XenditOptions> opt, IBillingService billingService)
        {
            _platform = platform; _payment = payment; _opt = opt;
            _billingService = billingService;
        }

        //[HttpPost("xendit-account")]
        ////[Authorize(Roles = "Operator,Admin")]
        //public async Task<IActionResult> CreateXenditAccount(
        //    string operatorId, [FromBody] CreateAccountDto dto)
        //{
        //    var acc = await _platform.CreateSubAccountAsync(operatorId, dto.Email, dto.BusinessName);
        //    return Ok(acc);
        //}

        [HttpGet("balance")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<ActionResult<BalanceDto>> GetBalance(string operatorId)
            => Ok(await _payment.GetOperatorBalanceAsync(operatorId));

        // GET /api/operators/{id}/payments/transactions?from=2025-10-01&to=2025-10-02&limit=50
        [HttpGet("transactions")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<ActionResult<TransactionListDto>> GetTransactions(
            string operatorId, DateTime? from, DateTime? to, int limit = 50)
            => Ok(await _payment.GetOperatorPaymentsAsync(operatorId, from, to, limit));

        [HttpGet("totals")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetTotals(string operatorId, DateTime? from, DateTime? to)
            => Ok(await _payment.GetOperatorTotalsAsync(operatorId, from, to));

        // Endpoint 2: Lấy danh sách hóa đơn chưa thanh toán (Báo đỏ)
        //[HttpGet("subscriptions/pending")]
        //[Authorize(Roles = "Operator,Admin")]
        //public async Task<IActionResult> GetPendingSubscriptions(string operatorId)
        //{
        //    // Lấy các hóa đơn Subscription có trạng thái PENDING hoặc EXPIRED
        //    var records = await _payment.GetSubscriptionInvoicesByStatusAsync(
        //        operatorId,
        //        new[] { "PENDING", "EXPIRED" });

        //    var result = records.Select(pr => new
        //    {
        //        pr.Id,
        //        pr.ExternalId,
        //        pr.Amount,
        //        pr.Status,
        //        pr.CheckoutUrl,
        //        // Hiển thị ngày đáo hạn cho Operator
        //        pr.DueDate,
        //        IsOverdue = pr.DueDate.HasValue && pr.DueDate.Value < TimeConverter.ToVietnamTime(DateTime.UtcNow)
        //    });

        //    return Ok(result);
        //}
        [HttpGet("parking/xendit-invoice-detail")]
        //[Authorize(Roles = "Driver,Operator,Admin")]
        public async Task<IActionResult> GetXenditInvoiceDetail( string paymentId)
        {
            if (string.IsNullOrEmpty(paymentId))
            {
                return BadRequest(new { message = "Cần cung cấp Xendit Invoice ID." });
            }

            // Gọi phương thức mới để lấy chi tiết hóa đơn
            var detail = await _payment.GetXenditInvoiceDetailAsync(paymentId);

            return Ok(detail);
        }

        [HttpPost("run-monthly-billing")]
        public async Task<IActionResult> RunMonthlyBillingManually()
        {
            try
            {
                // Gọi hàm logic cốt lõi
                await _billingService.RunMonthlyBillingAndSuspensionJobAsync();

                return Ok(new
                {
                    message = "✅ Job thanh toán định kỳ và giám sát đã được kích hoạt thủ công thành công.",
                    note = "Vui lòng kiểm tra log và MongoDB để xác minh các hóa đơn đã được tạo và các tài khoản nợ đã bị khóa."
                });
            }
            catch (Exception ex)
            {
                // Trả về lỗi chi tiết để dễ debug trong môi trường test
                return StatusCode(500, new
                {
                    message = "❌ Lỗi khi chạy Job thanh toán thủ công.",
                    detail = ex.Message
                });
            }
        }
    }

    public class CreateAccountDto { public string Email { get; set; } public string BusinessName { get; set; } }

}
