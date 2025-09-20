using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.CommentDtos;
using CoreService.Common.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface ICommentApplication
    {
        Task<ApiResponse<CommentItemDto>> CreateAsync(CommentCreateDto dto, string accountId);
        Task<ApiResponse<CommentItemDto>> UpdateAsync(CommentUpdateDto dto, string accountId);
        Task<ApiResponse<bool>> DeleteAsync(string id, string accountId);

        // ĐÃ CÓ: theo ParkingLot (cũ) — nếu bạn đã viết, có thể giữ lại
        Task<ApiResponse<PaginationDto<CommentItemDto>>> GetByParkingLotAsync(string parkingLotId, int? page, int? pageSize);

        // MỚI: theo FAQ
        Task<ApiResponse<PaginationDto<CommentItemDto>>> GetByFaqAsync(string faqId, int? page, int? pageSize);
    }
}
