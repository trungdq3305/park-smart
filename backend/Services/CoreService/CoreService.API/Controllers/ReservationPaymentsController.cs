using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/operators/{operatorId}/reservations")]
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

        [HttpPost("{reservationId}/pay")]
        [Authorize(Roles = "Driver,Operator,Admin")]
        public async Task<IActionResult> Pay(string operatorId, string reservationId, [FromBody] PayDto dto)
        {
            var pr = await _payment.CreateReservationInvoiceAsync(
                operatorId, reservationId, dto.Amount);
            return Ok(new { pr.XenditInvoiceId, pr.Status, pr.CheckoutUrl });
        }

        public class RefundDto
        {
            public long Amount { get; set; }               // null => full refund
            public string Reason { get; set; } = "REQUESTED_BY_CUSTOMER";
        }


        [HttpPost("{reservationId}/refund")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> RefundByReservation(
            string operatorId, string reservationId, [FromBody] RefundDto dto)
        {
            var rf = await _payment.RefundAsync(operatorId, reservationId, dto.Amount, dto.Reason);
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
        public async Task<IActionResult> Confirm(
            [FromQuery] string operatorId,
            [FromQuery] string reservationId
            //[FromQuery] string externalId,
            //[FromQuery] string result // "success" | "failure"
        )
        {
            // 1) Lấy payment record mới nhất theo reservation
            var pr = await _payment.GetLatestPaymentByReservationAsync(reservationId);
            if (pr == null)
                return NotFound(new { message = "No payment found for reservation" });

            // 2) Gọi Xendit get invoice để lấy trạng thái thật (tránh user tự sửa query)
            var status = await _payment.GetInvoiceStatusAsync(operatorId, pr.XenditInvoiceId);

            // 3) Map trạng thái -> cập nhật DB
            //  PENDING/PAID/SETTLED/EXPIRED/CANCELED
            await _payment.UpdatePaymentStatusAsync(pr.XenditInvoiceId, status);

            // 4) (tuỳ chọn) chuyển hướng sang UI cuối cùng, mang theo status
            var finalUi = $"https://parksmart.vn/pay-result" +
                          $"?reservationId={Uri.EscapeDataString(reservationId)}" +
                          $"&invoiceId={Uri.EscapeDataString(pr.XenditInvoiceId)}" +
                          $"&status={Uri.EscapeDataString(status)}";
            return Redirect(finalUi);
        }
    }

}
