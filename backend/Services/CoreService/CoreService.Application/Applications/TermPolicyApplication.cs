using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.TermPolicyDtos;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class TermPolicyApplication : ITermPolicyApplication
    {
        private readonly ITermAndPolicyRepository _repo;

        public TermPolicyApplication(ITermAndPolicyRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<TermPolicyResponseDto>> CreateAsync(TermPolicyCreateDto dto, string actorAccountId)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
                throw new ApiException("Title/Content không được để trống", StatusCodes.Status400BadRequest);

            var entity = new TermAndPolicy
            {
                CityAdminId = actorAccountId,
                Title = dto.Title,
                Content = dto.Content,
                Description = dto.Description,
                CreatedBy = actorAccountId
            };
            await _repo.AddAsync(entity);

            var res = Map(entity);
            return new ApiResponse<TermPolicyResponseDto>(res, true, "Tạo Term/Policy thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<TermPolicyResponseDto>> UpdateAsync(TermPolicyUpdateDto dto, string actorAccountId)
        {
            var entity = await _repo.GetByIdAsync(dto.Id)
                ?? throw new ApiException("Term/Policy không tồn tại", StatusCodes.Status404NotFound);

            entity.Title = dto.Title ?? entity.Title;
            entity.Content = dto.Content ?? entity.Content;
            entity.Description = dto.Description ?? entity.Description;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = actorAccountId;

            await _repo.UpdateAsync(entity);

            var res = Map(entity);
            return new ApiResponse<TermPolicyResponseDto>(res, true, "Cập nhật Term/Policy thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<TermPolicyResponseDto>> GetByIdAsync(string id)
        {
            var entity = await _repo.GetByIdAsync(id)
                ?? throw new ApiException("Term/Policy không tồn tại", StatusCodes.Status404NotFound);

            return new ApiResponse<TermPolicyResponseDto>(Map(entity), true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<TermPolicyResponseDto>>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<TermPolicyResponseDto>>(list, true, "Lấy danh sách Term and Policy thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<TermPolicyResponseDto>>> GetByAdminAsync(string cityAdminId)
        {
            var items = await _repo.GetByAdminIdAsync(cityAdminId);
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<TermPolicyResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<object>> DeleteAsync(string id, string actorAccountId)
        {
            var entity = await _repo.GetByIdAsync(id)
                ?? throw new ApiException("Term/Policy không tồn tại", StatusCodes.Status404NotFound);

            await _repo.SoftDeleteAsync(id, actorAccountId, DateTime.UtcNow);
            return new ApiResponse<object>(null, true, "Đã xoá (soft delete)", StatusCodes.Status200OK);
        }

        private static TermPolicyResponseDto Map(TermAndPolicy x) => new()
        {
            Id = x.Id,
            CityAdminId = x.CityAdminId,
            Title = x.Title,
            Content = x.Content,
            Description = x.Description,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt,
            CreatedBy = x.CreatedBy,
            UpdatedBy = x.UpdatedBy
        };
    }
}
