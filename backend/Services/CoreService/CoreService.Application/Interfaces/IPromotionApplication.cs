using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.PromotionDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IPromotionApplication
    {
        Task<ApiResponse<PromotionResponseDto>> CreateAsync(PromotionCreateDto dto, string actorAccountId);
        Task<ApiResponse<PromotionResponseDto>> UpdateAsync(PromotionUpdateDto dto, string actorAccountId);
        Task<ApiResponse<object>> DeleteAsync(string id, string actorAccountId);
        Task<ApiResponse<PromotionResponseDto>> GetByIdAsync(string id);
        Task<ApiResponse<List<PromotionResponseDto>>> GetAllAsync();
        Task<ApiResponse<PromotionRuleResponseDto>> AddRuleAsync(PromotionRuleCreateDto dto, string actorAccountId);
        Task<ApiResponse<object>> RemoveRuleAsync(string ruleId, string actorAccountId);
        Task<ApiResponse<object>> UsePromotionAsync(PromotionCalculateRequestDto dto);
        Task<ApiResponse<PromotionCalculateResponseDto>> CalculateAsync(PromotionCalculateRequestDto dto);
    }
}
