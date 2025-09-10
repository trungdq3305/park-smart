
using CoreService.Application.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/account")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountApplication _accountApplication;

        public AccountController(IAccountApplication accountApplication)
        {
            _accountApplication = accountApplication;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int? pageSize)
        {
            var response = await _accountApplication.GetAllAsync(page, pageSize);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("by-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByRole([FromQuery] string role, [FromQuery] int? page, [FromQuery] int? pageSize)
        {
            var response = await _accountApplication.GetByRoleAsync(role, page, pageSize);
            return StatusCode(response.StatusCode, response);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var response = await _accountApplication.GetMeAsync();
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var response = await _accountApplication.GetByIdAsync(id);
            return StatusCode(response.StatusCode, response);
        }
        [HttpGet("driver/{driverId}")]
        public async Task<IActionResult> GetByDriverId(string driverId)
        {
            var response = await _accountApplication.GetByDriverIdAsync(driverId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("operator/{operatorId}")]
        public async Task<IActionResult> GetByOperatorId(string operatorId)
        {
            var response = await _accountApplication.GetByOperatorIdAsync(operatorId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("admin/{adminId}")]
        public async Task<IActionResult> GetByAdminId(string adminId)
        {
            var response = await _accountApplication.GetByAdminIdAsync(adminId);
            return StatusCode(response.StatusCode, response);
        }

        //[HttpPost]
        //public async Task<IActionResult> Create([FromBody] Account account)
        //{
        //    var response = await _accountApplication.CreateAsync(account);
        //    return StatusCode(response.StatusCode, response);
        //}

        //[HttpPut("{id}")]
        //public async Task<IActionResult> Update(string id, [FromBody] Account account)
        //{
        //    var response = await _accountApplication.UpdateAsync(id, account);
        //    return StatusCode(response.StatusCode, response);
        //}

        //[HttpDelete("{id}")]
        //public async Task<IActionResult> Delete(string id)
        //{
        //    var response = await _accountApplication.DeleteAsync(id);
        //    return StatusCode(response.StatusCode, response);
        //}

    }
}
