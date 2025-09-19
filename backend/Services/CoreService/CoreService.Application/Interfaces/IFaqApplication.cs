using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.FaqDtos;
using CoreService.Common.Helpers;
using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IFaqApplication
    {
        Task<ApiResponse<FaqResponseDto>> CreateAsync(FaqCreateDto dto, string accountId);
        Task<ApiResponse<FaqResponseDto>> UpdateAsync(FaqUpdateDto dto, string accountId);
        Task<ApiResponse<bool>> DeleteAsync(string id, string accountId);
        Task<ApiResponse<PaginationDto<FaqResponseDto>>> GetPagedAsync(int? page, int? pageSize);
        Task<ApiResponse<FaqResponseDto>> GetByIdAsync(string id);
        Task<ApiResponse<Faq>> ApproveAsync(string faqId, string adminId);
        Task<ApiResponse<Faq>> RejectAsync(string faqId, string adminId);
        Task<ApiResponse<PaginationDto<FaqResponseDto>>> GetByStatusAsync(string status, int? page, int? pageSize);
        Task<ApiResponse<PaginationDto<FaqResponseDto>>> GetMineAsync(string accountId, int? page, int? pageSize);
    }

}
