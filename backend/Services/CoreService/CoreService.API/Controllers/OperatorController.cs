using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/operator")]
    [ApiController]
    public class OperatorController : ControllerBase
    {
        private readonly IOperatorApplication _operatorApplication;

        public OperatorController(IOperatorApplication operatorApplication)
        {
            _operatorApplication = operatorApplication;
        }

        [HttpPut]
        [Authorize(Roles = "Operator")]
        public async Task<IActionResult> Update([FromBody] OperatorUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var response = await _operatorApplication.UpdateAsync(dto, accountId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
