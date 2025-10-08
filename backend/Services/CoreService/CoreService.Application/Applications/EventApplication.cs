﻿using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.EventDtos;
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
    public class EventApplication : IEventApplication
    {
        private readonly IEventRepository _repo;
        public EventApplication(IEventRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<EventResponseDto>> CreateAsync(EventCreateDto dto, string actorAccountId, string actorRole)
        {
            var entity = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Location = dto.Location,
                ParkingLotId = dto.ParkingLotId,
                IncludedPromotions = dto.IncludedPromotions,
                CreatedBy = actorAccountId,
            };

            if (actorRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            {
                entity.CityAdminId = actorAccountId;
            }
            else if (actorRole.Equals("Operator", StringComparison.OrdinalIgnoreCase))
            {
                entity.OperatorId = dto.OperatorId; // Cần kiểm tra xem operatorId này có thuộc về actor không
            }

            await _repo.AddAsync(entity);
            return new ApiResponse<EventResponseDto>(Map(entity), true, "Tạo sự kiện thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<EventResponseDto>> UpdateAsync(EventUpdateDto dto, string actorAccountId, string actorRole)
        {
            var entity = await _repo.GetByIdAsync(dto.Id) ?? throw new ApiException("Sự kiện không tồn tại", StatusCodes.Status404NotFound);

            // Authorization check: Only creator or Admin can update
            if (entity.CreatedBy != actorAccountId && !actorRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                throw new ApiException("Bạn không có quyền chỉnh sửa sự kiện này", StatusCodes.Status403Forbidden);

            entity.Title = dto.Title ?? entity.Title;
            entity.Description = dto.Description ?? entity.Description;
            entity.StartDate = dto.StartDate ?? entity.StartDate;
            entity.EndDate = dto.EndDate ?? entity.EndDate;
            entity.Location = dto.Location ?? entity.Location;
            entity.IncludedPromotions = dto.IncludedPromotions ?? entity.IncludedPromotions;
            entity.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            entity.UpdatedBy = actorAccountId;

            await _repo.UpdateAsync(entity);
            return new ApiResponse<EventResponseDto>(Map(entity), true, "Cập nhật sự kiện thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<object>> DeleteAsync(string id, string actorAccountId, string actorRole)
        {
            var entity = await _repo.GetByIdAsync(id) ?? throw new ApiException("Sự kiện không tồn tại", StatusCodes.Status404NotFound);

            if (entity.CreatedBy != actorAccountId && !actorRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                throw new ApiException("Bạn không có quyền xóa sự kiện này", StatusCodes.Status403Forbidden);

            await _repo.SoftDeleteAsync(id, actorAccountId, TimeConverter.ToVietnamTime(DateTime.UtcNow));
            return new ApiResponse<object>(null, true, "Xóa sự kiện thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<EventResponseDto>> GetByIdAsync(string id)
        {
            var entity = await _repo.GetByIdAsync(id) ?? throw new ApiException("Sự kiện không tồn tại", StatusCodes.Status404NotFound);
            return new ApiResponse<EventResponseDto>(Map(entity), true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<EventResponseDto>>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<EventResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<EventResponseDto>>> GetUpcomingAsync()
        {
            var items = await _repo.GetUpcomingEventsAsync();
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<EventResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        private static EventResponseDto Map(Event x) => new()
        {
            Id = x.Id,
            OperatorId = x.OperatorId,
            ParkingLotId = x.ParkingLotId,
            CityAdminId = x.CityAdminId,
            Title = x.Title,
            Description = x.Description,
            StartDate = x.StartDate,
            EndDate = x.EndDate,
            Location = x.Location,
            IncludedPromotions = x.IncludedPromotions,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt,
            CreatedBy = x.CreatedBy,
            UpdatedBy = x.UpdatedBy
        };
    }
}
