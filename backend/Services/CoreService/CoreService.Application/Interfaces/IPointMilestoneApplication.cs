using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.PointDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IPointMilestoneApplication
    {
        Task<ApiResponse<PointMilestoneItemDto>> CreateAsync(PointMilestoneCreateDto dto, string accountId);
        Task<ApiResponse<PointMilestoneItemDto>> UpdateAsync(PointMilestoneUpdateDto dto, string accountId);
        Task<ApiResponse<bool>> DeleteAsync(string id, string accountId);

        Task<ApiResponse<IEnumerable<PointMilestoneItemDto>>> GetAllAsync();
        Task<ApiResponse<IEnumerable<PointMilestoneItemDto>>> GetAllCreditAsync();
        Task<ApiResponse<IEnumerable<PointMilestoneItemDto>>> GetAllAccumulatedAsync();
        Task<ApiResponse<PointMilestoneItemDto>> GetByIdAsync(string id);
    }
}
