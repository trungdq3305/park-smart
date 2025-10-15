using CoreService.Application.DTOs.ReportDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/reports")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly IReportApplication _app;
        public ReportsController(IReportApplication app) { _app = app; }

        [HttpPost]
        [Authorize(Roles = "Driver,Operator")]
        public async Task<IActionResult> Create([FromBody] ReportCreateDto dto)
        {
            var accountId = User.FindFirst("id")?.Value;
            var role = User.FindFirst("role")?.Value;
            var res = await _app.CreateAsync(dto, accountId, role);
            return StatusCode(res.StatusCode, res);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var res = await _app.GetAllAsync();
            return StatusCode(res.StatusCode, res);
        }

        [HttpGet("my-reports")]
        [Authorize(Roles = "Driver,Operator")]
        public async Task<IActionResult> GetMyReports()
        {
            var accountId = User.FindFirst("id")?.Value;
            var res = await _app.GetMyReportsAsync(accountId);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut("process")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ProcessReport([FromBody] ReportProcessDto dto)
        {
            var adminId = User.FindFirst("id")?.Value;
            var res = await _app.ProcessReportAsync(dto, adminId);
            return StatusCode(res.StatusCode, res);
        }
    }
}
