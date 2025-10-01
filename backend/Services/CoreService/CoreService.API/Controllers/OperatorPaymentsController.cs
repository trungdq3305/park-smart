using CoreService.Application.Applications;
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

        [HttpGet("balance")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetBalance(string operatorId)
            => Ok(await _payment.GetOperatorBalanceAsync(operatorId));

        [HttpGet("transactions")]
        [Authorize(Roles = "Operator,Admin")]
        public async Task<IActionResult> GetTransactions(string operatorId)
            => Ok(await _payment.GetOperatorPaymentsAsync(operatorId));
    }

    public class CreateAccountDto { public string Email { get; set; } public string BusinessName { get; set; } }

}
