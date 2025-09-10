﻿using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CoreService.API.Controllers
{
    [Route("api/drivers")]
    [ApiController]
    public class DriverController : ControllerBase
    {
        private readonly IDriverApplication _driverApplication;

        public DriverController(IDriverApplication driverApplication)
        {
            _driverApplication = driverApplication;
        }

        [HttpPut]
        [Authorize(Roles = "Driver")]
        public async Task<IActionResult> Update([FromBody] DriverUpdateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var response = await _driverApplication.UpdateAsync(dto, accountId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
