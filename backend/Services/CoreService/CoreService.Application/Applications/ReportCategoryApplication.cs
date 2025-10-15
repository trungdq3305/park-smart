using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.CategoryDtos;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class ReportCategoryApplication : IReportCategoryApplication
    {
        private readonly IReportCategoryRepository _repo;
        public ReportCategoryApplication(IReportCategoryRepository repo) { _repo = repo; }

        public async Task<ApiResponse<CategoryResponseDto>> CreateAsync(CategoryCreateDto dto)
        {
            var entity = new ReportCategory { Name = dto.Name, Description = dto.Description };
            await _repo.AddAsync(entity);
            return new ApiResponse<CategoryResponseDto>(Map(entity), true, "Tạo danh mục thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<CategoryResponseDto>> UpdateAsync(CategoryUpdateDto dto)
        {
            var entity = await _repo.GetByIdAsync(dto.Id) ?? throw new ApiException("Danh mục không tồn tại", StatusCodes.Status404NotFound);
            entity.Name = dto.Name ?? entity.Name;
            entity.Description = dto.Description ?? entity.Description;
            await _repo.UpdateAsync(entity);
            return new ApiResponse<CategoryResponseDto>(Map(entity), true, "Cập nhật danh mục thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<object>> DeleteAsync(string id)
        {
            _ = await _repo.GetByIdAsync(id) ?? throw new ApiException("Danh mục không tồn tại", StatusCodes.Status404NotFound);
            await _repo.DeleteAsync(id);
            return new ApiResponse<object>(null, true, "Xóa danh mục thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<CategoryResponseDto>>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<CategoryResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        private static CategoryResponseDto Map(ReportCategory x) => new() { Id = x.Id, Name = x.Name, Description = x.Description };
    }
}
