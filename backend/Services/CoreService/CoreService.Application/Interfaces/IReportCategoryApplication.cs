using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.CategoryDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IReportCategoryApplication
    {
        Task<ApiResponse<CategoryResponseDto>> CreateAsync(CategoryCreateDto dto);
        Task<ApiResponse<CategoryResponseDto>> UpdateAsync(CategoryUpdateDto dto);
        Task<ApiResponse<object>> DeleteAsync(string id);
        Task<ApiResponse<List<CategoryResponseDto>>> GetAllAsync();
    }
}
