using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.PromotionDtos;
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
    public class PromotionApplication : IPromotionApplication
    {
        private readonly IPromotionRepository _promoRepo;
        private readonly IPromotionRuleRepository _ruleRepo;

        public PromotionApplication(IPromotionRepository promoRepo, IPromotionRuleRepository ruleRepo)
        {
            _promoRepo = promoRepo;
            _ruleRepo = ruleRepo;
        }

        public async Task<ApiResponse<PromotionResponseDto>> CreateAsync(PromotionCreateDto dto, string actorAccountId)
        {
            var existingCode = await _promoRepo.GetByCodeAsync(dto.Code);
            if (existingCode != null)
                throw new ApiException("Mã khuyến mãi đã tồn tại", StatusCodes.Status409Conflict);

            if (dto.StartDate >= dto.EndDate)
                throw new ApiException("Ngày bắt đầu phải trước ngày kết thúc", StatusCodes.Status400BadRequest);

            var entity = new Promotion
            {
                Code = dto.Code,
                Name = dto.Name,
                Description = dto.Description,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MaxDiscountAmount = dto.MaxDiscountAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TotalUsageLimit = dto.TotalUsageLimit,
                IsActive = dto.IsActive,
                CreatedBy = actorAccountId
            };

            await _promoRepo.AddAsync(entity);
            var res = await MapToResponseDto(entity);
            return new ApiResponse<PromotionResponseDto>(res, true, "Tạo khuyến mãi thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<PromotionResponseDto>> UpdateAsync(PromotionUpdateDto dto, string actorAccountId)
        {
            var entity = await _promoRepo.GetByIdAsync(dto.Id) ?? throw new ApiException("Khuyến mãi không tồn tại", StatusCodes.Status404NotFound);

            entity.Name = dto.Name ?? entity.Name;
            entity.Description = dto.Description ?? entity.Description;
            entity.DiscountValue = dto.DiscountValue ?? entity.DiscountValue;
            entity.MaxDiscountAmount = dto.MaxDiscountAmount ?? entity.MaxDiscountAmount;
            entity.StartDate = dto.StartDate ?? entity.StartDate;
            entity.EndDate = dto.EndDate ?? entity.EndDate;
            entity.TotalUsageLimit = dto.TotalUsageLimit ?? entity.TotalUsageLimit;
            entity.IsActive = dto.IsActive ?? entity.IsActive;
            entity.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            entity.UpdatedBy = actorAccountId;

            await _promoRepo.UpdateAsync(entity);
            var res = await MapToResponseDto(entity);
            return new ApiResponse<PromotionResponseDto>(res, true, "Cập nhật khuyến mãi thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<object>> DeleteAsync(string id, string actorAccountId)
        {
            _ = await _promoRepo.GetByIdAsync(id) ?? throw new ApiException("Khuyến mãi không tồn tại", StatusCodes.Status404NotFound);
            await _promoRepo.SoftDeleteAsync(id, actorAccountId, TimeConverter.ToVietnamTime(DateTime.UtcNow));
            return new ApiResponse<object>(null, true, "Xóa khuyến mãi thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<PromotionResponseDto>> GetByIdAsync(string id)
        {
            var entity = await _promoRepo.GetByIdAsync(id) ?? throw new ApiException("Khuyến mãi không tồn tại", StatusCodes.Status404NotFound);
            var res = await MapToResponseDto(entity);
            return new ApiResponse<PromotionResponseDto>(res, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<PromotionResponseDto>>> GetAllAsync()
        {
            var items = await _promoRepo.GetAllAsync();
            if (items == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var tasks = items.Select(MapToResponseDto);
            var list = (await Task.WhenAll(tasks)).ToList();
            return new ApiResponse<List<PromotionResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<PromotionRuleResponseDto>> AddRuleAsync(PromotionRuleCreateDto dto, string actorAccountId)
        {
            _ = await _promoRepo.GetByIdAsync(dto.PromotionId) ?? throw new ApiException("Khuyến mãi không tồn tại", StatusCodes.Status404NotFound);

            var ruleEntity = new PromotionRule
            {
                PromotionId = dto.PromotionId,
                RuleType = dto.RuleType,
                RuleValue = dto.RuleValue
            };
            await _ruleRepo.AddAsync(ruleEntity);

            var res = new PromotionRuleResponseDto
            {
                Id = ruleEntity.Id,
                PromotionId = ruleEntity.PromotionId,
                RuleType = ruleEntity.RuleType,
                RuleValue = ruleEntity.RuleValue
            };

            return new ApiResponse<PromotionRuleResponseDto>(res, true, "Thêm điều kiện thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<object>> RemoveRuleAsync(string ruleId, string actorAccountId)
        {
            _ = await _ruleRepo.GetByIdAsync(ruleId) ?? throw new ApiException("Điều kiện không tồn tại", StatusCodes.Status404NotFound);
            await _ruleRepo.DeleteAsync(ruleId);
            return new ApiResponse<object>(null, true, "Xóa điều kiện thành công", StatusCodes.Status200OK);
        }

        private async Task<PromotionResponseDto> MapToResponseDto(Promotion x)
        {
            var rules = await _ruleRepo.GetByPromotionIdAsync(x.Id);
            return new PromotionResponseDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Description = x.Description,
                DiscountType = x.DiscountType,
                DiscountValue = x.DiscountValue,
                MaxDiscountAmount = x.MaxDiscountAmount,
                StartDate = x.StartDate,
                EndDate = x.EndDate,
                TotalUsageLimit = x.TotalUsageLimit,
                CurrentUsageCount = x.CurrentUsageCount,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                CreatedBy = x.CreatedBy,
                UpdatedBy = x.UpdatedBy,
                Rules = rules.Select(r => new PromotionRuleResponseDto
                {
                    Id = r.Id,
                    PromotionId = r.PromotionId,
                    RuleType = r.RuleType,
                    RuleValue = r.RuleValue
                }).ToList()
            };
        }
    }
}
