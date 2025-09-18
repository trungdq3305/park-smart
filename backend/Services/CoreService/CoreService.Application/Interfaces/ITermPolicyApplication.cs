using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.TermPolicyDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface ITermPolicyApplication
    {
        Task<ApiResponse<TermPolicyResponseDto>> CreateAsync(TermPolicyCreateDto dto, string actorAccountId);
        Task<ApiResponse<TermPolicyResponseDto>> UpdateAsync(TermPolicyUpdateDto dto, string actorAccountId);
        Task<ApiResponse<TermPolicyResponseDto>> GetByIdAsync(string id);
        Task<ApiResponse<List<TermPolicyResponseDto>>> GetAllAsync();
        Task<ApiResponse<object>> DeleteAsync(string id, string actorAccountId);
        Task<ApiResponse<List<TermPolicyResponseDto>>> GetByAdminAsync(string cityAdminId);
    }
}
