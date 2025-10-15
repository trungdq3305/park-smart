using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.CategoryDtos;
using CoreService.Application.DTOs.ReportDtos;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class ReportApplication : IReportApplication
    {
        private readonly IReportRepository _reportRepo;
        private readonly IReportCategoryRepository _categoryRepo;
        public ReportApplication(IReportRepository reportRepo, IReportCategoryRepository categoryRepo)
        {
            _reportRepo = reportRepo;
            _categoryRepo = categoryRepo;
        }

        public async Task<ApiResponse<ReportResponseDto>> CreateAsync(ReportCreateDto dto, string actorAccountId, string actorRole)
        {
            _ = await _categoryRepo.GetByIdAsync(dto.CategoryId) ?? throw new ApiException("Danh mục báo cáo không hợp lệ", StatusCodes.Status400BadRequest);

            var entity = new Report
            {
                ParkingLotId = dto.ParkingLotId,
                CategoryId = dto.CategoryId,
                Reason = dto.Reason,
                CreatedBy = actorAccountId,
                IsProcessed = false // Mặc định là chưa xử lý
            };

            if (actorRole.Equals("Driver", StringComparison.OrdinalIgnoreCase))
                entity.DriverId = actorAccountId;
            else if (actorRole.Equals("Operator", StringComparison.OrdinalIgnoreCase))
                entity.OperatorId = actorAccountId;
            else
                throw new ApiException("Vai trò không hợp lệ để tạo báo cáo", StatusCodes.Status403Forbidden);

            await _reportRepo.AddAsync(entity);
            var response = await MapToResponseDto(entity);
            return new ApiResponse<ReportResponseDto>(response, true, "Gửi báo cáo thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<ReportResponseDto>> ProcessReportAsync(ReportProcessDto dto, string adminId)
        {
            var entity = await _reportRepo.GetByIdAsync(dto.Id) ?? throw new ApiException("Báo cáo không tồn tại", StatusCodes.Status404NotFound);

            entity.IsProcessed = true; // Đánh dấu là đã xử lý
            entity.Response = dto.Response;
            entity.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            entity.UpdatedBy = adminId;

            await _reportRepo.UpdateAsync(entity);
            var response = await MapToResponseDto(entity);
            return new ApiResponse<ReportResponseDto>(response, true, "Xử lý báo cáo thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<ReportResponseDto>>> GetAllAsync()
        {
            var items = await _reportRepo.GetAllAsync();
            var tasks = items.Select(MapToResponseDto);
            var list = (await Task.WhenAll(tasks)).ToList();
            return new ApiResponse<List<ReportResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<ReportResponseDto>>> GetMyReportsAsync(string actorAccountId)
        {
            var items = await _reportRepo.GetByCreatorIdAsync(actorAccountId);
            var tasks = items.Select(MapToResponseDto);
            var list = (await Task.WhenAll(tasks)).ToList();
            return new ApiResponse<List<ReportResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        private async Task<ReportResponseDto> MapToResponseDto(Report x)
        {
            var category = await _categoryRepo.GetByIdAsync(x.CategoryId);
            return new ReportResponseDto
            {
                Id = x.Id,
                DriverId = x.DriverId,
                OperatorId = x.OperatorId,
                ParkingLotId = x.ParkingLotId,
                Category = category != null ? new CategoryResponseDto { Id = category.Id, Name = category.Name, Description = category.Description } : null,
                IsProcessed = x.IsProcessed,
                Reason = x.Reason,
                Response = x.Response,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                CreatedBy = x.CreatedBy,
                UpdatedBy = x.UpdatedBy
            };
        }
    }
}
