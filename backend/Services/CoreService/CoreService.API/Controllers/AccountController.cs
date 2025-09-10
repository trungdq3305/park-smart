
using CoreService.Application.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountApplication _accountApplication;

        public AccountController(IAccountApplication accountApplication)
        {
            _accountApplication = accountApplication;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var response = await _accountApplication.GetAllAsync();
            return StatusCode(response.StatusCode, response);
        }

        //[HttpGet("{id}")]
        //public async Task<IActionResult> GetById(string id)
        //{
        //    var response = await _accountApplication.GetByIdAsync(id);
        //    return StatusCode(response.StatusCode, response);
        //}

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
