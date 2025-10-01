using CoreService.Application.Applications;
using CoreService.Application.DTOs.PaymentDtos.CoreService.Application.DTOs.PaymentDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.PaymentHelper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CoreService.API.Controllers
{
    [Route("api/operators/{operatorId}/payments")]
    [ApiController]
    public class OperatorPaymentsController : ControllerBase
    {
        private readonly IXenditPlatformService _platform;
        private readonly IPaymentApp _payment;
        private readonly IOptions<XenditOptions> _opt;

        public OperatorPaymentsController(IXenditPlatformService platform, IPaymentApp payment, IOptions<XenditOptions> opt)
        { _platform = platform; _payment = payment; _opt = opt; }

        [HttpPost("xendit-account")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> CreateXenditAccount(
            string operatorId, [FromBody] CreateAccountDto dto)
        {
            var acc = await _platform.CreateSubAccountAsync(operatorId, dto.Email, dto.BusinessName);
            return Ok(new { acc.XenditUserId, acc.Status });
        }

        //[HttpGet("balance")]
        //[Authorize(Roles = "Operator,Admin")]
        //public async Task<IActionResult> GetBalance(string operatorId)
        //    => Ok(await _payment.GetOperatorBalanceAsync(operatorId));

        //[HttpGet("transactions")]
        //[Authorize(Roles = "Operator,Admin")]
        //public async Task<IActionResult> GetTransactions(string operatorId)
        //    => Ok(await _payment.GetOperatorPaymentsAsync(operatorId));
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
    }

    public class CreateAccountDto { public string Email { get; set; } public string BusinessName { get; set; } }

}
