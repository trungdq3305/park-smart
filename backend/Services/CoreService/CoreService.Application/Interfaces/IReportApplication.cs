using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.ReportDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IReportApplication
    {
        Task<ApiResponse<ReportResponseDto>> CreateAsync(ReportCreateDto dto, string actorAccountId, string actorRole);
        Task<ApiResponse<ReportResponseDto>> ProcessReportAsync(ReportProcessDto dto, string adminId); // DTO đã được đơn giản hóa
        Task<ApiResponse<List<ReportResponseDto>>> GetAllAsync();
        Task<ApiResponse<List<ReportResponseDto>>> GetMyReportsAsync(string actorAccountId);
    }
}
