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
            public string SuccessUrl { get; set; }
            public string FailureUrl { get; set; }
        }

        public ReservationPaymentsController(IPaymentApp payment) => _payment = payment;

        [HttpPost("{reservationId}/pay")]
        [Authorize(Roles = "Driver,Operator,Admin")]
        public async Task<IActionResult> Pay(string operatorId, string reservationId, [FromBody] PayDto dto)
        {
            var pr = await _payment.CreateReservationInvoiceAsync(
                operatorId, reservationId, dto.Amount, dto.SuccessUrl, dto.FailureUrl);
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

        // (tuỳ chọn) Refund theo invoiceId
        [HttpPost("invoices/{invoiceId}/refund")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> RefundByInvoice(string operatorId, string invoiceId, [FromBody] RefundDto dto)
        {
            var rf = await _payment.RefundByInvoiceAsync(operatorId, invoiceId, dto.Amount, dto.Reason);
            return Ok(new
            {
                rf.XenditRefundId,
                rf.Amount,
                rf.Status,
                rf.Reason
            });
        }
    }

}
