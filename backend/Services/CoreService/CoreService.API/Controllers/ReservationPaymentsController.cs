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

        public class RefundDto { public long Amount { get; set; } }

        //[HttpPost("{reservationId}/refund")]
        //[Authorize(Roles = "Operator,Admin")]
        //public async Task<IActionResult> Refund(string operatorId, string reservationId, [FromBody] RefundDto dto)
        //{
        //    // tìm invoice theo reservation
        //    // (giản lược – bạn có thể extend repo để truy theo ReservationId)
        //    return Ok(await _payment.RefundAsync(operatorId,
        //        (await _payment.GetOperatorPaymentsAsync(operatorId))
        //            .First(x => x.ReservationId == reservationId).XenditInvoiceId,
        //        dto.Amount));
        //}
    }

}
