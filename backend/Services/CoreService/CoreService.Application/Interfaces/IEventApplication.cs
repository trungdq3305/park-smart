using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.EventDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IEventApplication
    {
        Task<ApiResponse<EventResponseDto>> CreateAsync(EventCreateDto dto, string actorAccountId, string actorRole);
        Task<ApiResponse<EventResponseDto>> UpdateAsync(EventUpdateDto dto, string actorAccountId, string actorRole);
        Task<ApiResponse<object>> DeleteAsync(string id, string actorAccountId, string actorRole);
        Task<ApiResponse<EventResponseDto>> GetByIdAsync(string id);
        Task<ApiResponse<List<EventResponseDto>>> GetAllAsync();
        Task<ApiResponse<List<EventResponseDto>>> GetByAccIdAsync(string accid);
        Task<ApiResponse<List<EventResponseDto>>> GetUpcomingAsync();
    }
}
