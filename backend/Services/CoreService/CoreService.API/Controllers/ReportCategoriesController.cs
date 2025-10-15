using CoreService.Application.DTOs.CategoryDtos;
using CoreService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CoreService.API.Controllers
{
    [Route("api/reportcategories")]
    [ApiController]
    public class ReportCategoriesController : ControllerBase
    {
        private readonly IReportCategoryApplication _app;
        public ReportCategoriesController(IReportCategoryApplication app) { _app = app; }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var res = await _app.GetAllAsync();
            return StatusCode(res.StatusCode, res);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto)
        {
            var res = await _app.CreateAsync(dto);
            return StatusCode(res.StatusCode, res);
        }

        [HttpPut]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update([FromBody] CategoryUpdateDto dto)
        {
            var res = await _app.UpdateAsync(dto);
            return StatusCode(res.StatusCode, res);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            var res = await _app.DeleteAsync(id);
            return StatusCode(res.StatusCode, res);
        }
    }
}
