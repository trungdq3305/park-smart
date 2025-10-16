using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.BlacklistDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IBlacklistApplication
    {
        Task<ApiResponse<BlacklistResponseDto>> CreateAsync(BlacklistCreateDto dto, string operatorId);
        Task<ApiResponse<BlacklistResponseDto>> UpdateAsync(BlacklistUpdateDto dto, string operatorId);
        Task<ApiResponse<object>> DeleteAsync(string id, string operatorId);
        Task<ApiResponse<BlacklistResponseDto>> GetByIdAsync(string id);
        Task<ApiResponse<List<BlacklistResponseDto>>> GetByOperatorIdAsync(string operatorId);
        Task<ApiResponse<List<BlacklistResponseDto>>> GetAllAsync();
    }
}
