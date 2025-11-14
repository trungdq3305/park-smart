using CoreService.Application.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace CoreService.API.Controllers
{
    [Route("api/payments")]
    [ApiController]
    public class ReservationPaymentsController : ControllerBase
    {
        private readonly IPaymentApp _payment;

        public class PayDto
        {
            public string ReservationId { get; set; }
            public long Amount { get; set; }
        }

        public ReservationPaymentsController(IPaymentApp payment) => _payment = payment;

        [HttpPost("pay")]
        [Authorize(Roles = "Driver,Operator,Admin")]
        public async Task<IActionResult> PayEntity(string operatorId, [FromBody] PayRequestDto dto)
        {
            // 1. Xác thực và lấy Account ID của người tạo Invoice
            var accountId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(accountId))
            {
                return Unauthorized(new { message = "Không tìm thấy Account ID trong token xác thực." });
            }

            // 2. Gọi Service chung duy nhất
            // Service sẽ tự động xác định PaymentType và gán ID tương ứng
            var pr = await _payment.CreatePaymentInvoiceAsync(
                operatorId,
                dto.EntityId,
                accountId,
                dto.Amount,
                dto.Type); // Truyền Enum Type

            // 3. Trả về kết quả cho Frontend
            return Ok(new
            {
                pr.XenditInvoiceId,
                pr.Status,
                pr.CheckoutUrl
            });
        }
        public class PayRequestDto
        {
            // ID của đối tượng (ReservationId, SubscriptionId, hoặc SessionId)
            [Required]
            public string EntityId { get; set; }

            // Loại thanh toán, sẽ được tự động map từ string JSON sang Enum
            [Required]
            [EnumDataType(typeof(PaymentType), ErrorMessage = "PaymentType không hợp lệ. Chỉ chấp nhận: RES, SUB, SES, OPR.")]
            public PaymentType Type { get; set; }

            // Số tiền cần thanh toán
            [Required]
            public long Amount { get; set; }
        }
        // Trong Controller
        [HttpGet("{id}")]
        //[Authorize(Roles = "Driver,Operator,Admin")]
        public async Task<IActionResult> GetById(string id)
        {
            var pr = await _payment.GetByIdAsync(id);
            return Ok(pr);
        }

        [HttpGet("createdBy/me")]
        [Authorize(Roles = "Driver,Operator,Admin")] // Các vai trò có thể tạo invoice
        public async Task<IActionResult> GetByCreatedByMe()
        {
            // Lấy accountId của người dùng hiện tại từ token (thông tin đã đăng nhập)
            var accountId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(accountId))
            {
                return Unauthorized(new { message = "Không tìm thấy Account ID trong token." });
            }

            var records = await _payment.GetByCreatedByAsync(accountId);

            // Sử dụng Ok(records) để trả về danh sách
            return Ok(records);
        }
        // Trong PaymentController
        // ...
        [HttpGet("createdBy/me/status")]
        [Authorize(Roles = "Driver,Operator,Admin")] // Các vai trò có thể tạo invoice
        public async Task<IActionResult> GetByCreatedByMeAndStatus([FromQuery] string status)
        {
            // 1. Lấy accountId của người dùng hiện tại từ token
            var accountId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(accountId))
            {
                return Unauthorized(new { message = "Không tìm thấy Account ID trong token." });
            }

            if (string.IsNullOrEmpty(status))
            {
                return BadRequest(new { message = "Vui lòng cung cấp trạng thái (status) cần lọc." });
            }

            try
            {
                // 2. Gọi Application Layer để lấy danh sách PaymentRecord theo CreatedBy và Status
                var records = await _payment.GetByCreatedByAndStatusAsync(accountId, status);

                if (records == null || !records.Any())
                {
                    return NotFound(new { message = $"Không tìm thấy giao dịch nào với trạng thái '{status}' được tạo bởi bạn." });
                }

                // 3. Trả về danh sách
                return Ok(records);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi (tùy thuộc vào cấu trúc logging của bạn)
                // Ví dụ: _logger.LogError(ex, "Lỗi khi lấy giao dịch theo trạng thái.");
                return StatusCode(500, new { message = "Đã xảy ra lỗi nội bộ khi xử lý yêu cầu." });
            }
        }
        [HttpGet("refunds/createdBy/me")] // Endpoint mới
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetRefundsByCreatedByMe()
        {
            // Lấy accountId của người dùng hiện tại từ token
            var accountId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(accountId))
            {
                return Unauthorized(new { message = "Không tìm thấy Account ID." });
            }

            // Gọi Service để lấy danh sách RefundRecord do người dùng này tạo
            var records = await _payment.GetRefundsByCreatedByAsync(accountId);

            return Ok(records);
        }
        public class RefundDto
        {
            public long Amount { get; set; }               // null => full refund
            public string Reason { get; set; } = "REQUESTED_BY_CUSTOMER";
        }


        [HttpPost("refund-by-id")] // Endpoint mới: refund theo PaymentRecord ID
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> RefundByPaymentId(
    string operatorId, string paymentId, [FromBody] RefundDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(accountId))
            {
                return Unauthorized(new { message = "Không tìm thấy Account ID trong token xác thực." });
            }
            // Gọi phương thức RefundAsync đã được tái cấu trúc
            var rf = await _payment.RefundByPaymentIdAsync(operatorId, paymentId, accountId, dto.Amount, dto.Reason);

            // Trả về thông tin Refund
            return Ok(new
            {
                rf.Data.XenditRefundId,
                rf.Data.Amount,
                rf.Data.Status,
                rf.Data.Reason
            });
        }

        //// (tuỳ chọn) Refund theo invoiceId
        //[HttpPost("invoices/{invoiceId}/refund")]
        //[Authorize(Roles = "Operator,Admin")]
        //public async Task<IActionResult> RefundByInvoice(string operatorId, string invoiceId, [FromBody] RefundDto dto)
        //{
        //    var rf = await _payment.RefundByInvoiceAsync(operatorId, invoiceId, dto.Amount, dto.Reason);
        //    return Ok(new
        //    {
        //        rf.XenditRefundId,
        //        rf.Amount,
        //        rf.Status,
        //        rf.Reason
        //    });
        //}
        [HttpGet("confirm")]
        [AllowAnonymous] // redirect từ Xendit không có auth
        public async Task<IActionResult> Confirm(string paymentId
            //[FromQuery] string externalId,
            //[FromQuery] string result // "success" | "failure"
        )
        {
            // 1) Lấy payment record mới nhất theo reservation
            var pr = await _payment.GetByIdAsync(paymentId);
            if (pr == null)
                return NotFound(new { message = "No payment found for reservation" });

            // 2) Gọi Xendit get invoice để lấy trạng thái thật (tránh user tự sửa query)
            var status = await _payment.GetInvoiceStatusAsync(pr.OperatorId, pr.XenditInvoiceId);

            // 3) Map trạng thái -> cập nhật DB
            //  PENDING/PAID/SETTLED/EXPIRED/CANCELED
            await _payment.UpdatePaymentStatusAsync(paymentId, status);

            // 4) (tuỳ chọn) chuyển hướng sang UI cuối cùng, mang theo status

            return Ok("Xác nhận thanh toán thành công");
        }
    }

}
