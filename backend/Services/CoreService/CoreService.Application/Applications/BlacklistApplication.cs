using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.BlacklistDtos;
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
    public class BlacklistApplication : IBlacklistApplication
    {
        private readonly IBlacklistRepository _repo;
        public BlacklistApplication(IBlacklistRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<BlacklistResponseDto>> CreateAsync(BlacklistCreateDto dto, string operatorId)
        {
            var existing = await _repo.FindByOperatorAndDriverAsync(operatorId, dto.DriverId);
            if (existing != null)
                throw new ApiException("Tài xế này đã có trong danh sách đen của bạn", StatusCodes.Status409Conflict);

            var entity = new Blacklist
            {
                OperatorId = operatorId,
                DriverId = dto.DriverId,
                Reason = dto.Reason,
                CreatedBy = operatorId
            };
            await _repo.AddAsync(entity);
            return new ApiResponse<BlacklistResponseDto>(Map(entity), true, "Thêm vào danh sách đen thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<BlacklistResponseDto>> UpdateAsync(BlacklistUpdateDto dto, string operatorId)
        {
            var entity = await _repo.GetByIdAsync(dto.Id) ?? throw new ApiException("Không tìm thấy mục trong danh sách đen", StatusCodes.Status404NotFound);
            if (entity.OperatorId != operatorId)
                throw new ApiException("Bạn không có quyền chỉnh sửa mục này", StatusCodes.Status403Forbidden);

            entity.Reason = dto.Reason;
            entity.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            entity.UpdatedBy = operatorId;

            await _repo.UpdateAsync(entity);
            return new ApiResponse<BlacklistResponseDto>(Map(entity), true, "Cập nhật lý do thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<object>> DeleteAsync(string id, string operatorId)
        {
            var entity = await _repo.GetByIdAsync(id) ?? throw new ApiException("Không tìm thấy mục trong danh sách đen", StatusCodes.Status404NotFound);
            if (entity.OperatorId != operatorId)
                throw new ApiException("Bạn không có quyền xóa mục này", StatusCodes.Status403Forbidden);

            await _repo.SoftDeleteAsync(id, operatorId, TimeConverter.ToVietnamTime(DateTime.UtcNow));
            return new ApiResponse<object>(null, true, "Xóa khỏi danh sách đen thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<BlacklistResponseDto>> GetByIdAsync(string id)
        {
            var entity = await _repo.GetByIdAsync(id) ?? throw new ApiException("Không tìm thấy mục trong danh sách đen", StatusCodes.Status404NotFound);
            return new ApiResponse<BlacklistResponseDto>(Map(entity), true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<BlacklistResponseDto>>> GetByOperatorIdAsync(string operatorId)
        {
            var items = await _repo.GetByOperatorIdAsync(operatorId);
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<BlacklistResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<BlacklistResponseDto>>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            if (items == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<BlacklistResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        private static BlacklistResponseDto Map(Blacklist x) => new()
        {
            Id = x.Id,
            OperatorId = x.OperatorId,
            DriverId = x.DriverId,
            Reason = x.Reason,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt
        };
    }
}
