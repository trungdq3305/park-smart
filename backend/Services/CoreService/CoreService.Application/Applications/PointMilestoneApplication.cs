using AutoMapper;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.PointDtos;
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
    public class PointMilestoneApplication : IPointMilestoneApplication
    {
        private readonly IPointMilestoneRepository _repo;
        private readonly IMapper _mapper;

        public PointMilestoneApplication(IPointMilestoneRepository repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        public async Task<ApiResponse<PointMilestoneItemDto>> CreateAsync(PointMilestoneCreateDto dto, string accountId)
        {
            var entity = _mapper.Map<PointMilestone>(dto);
            entity.CreatedBy = accountId;

            await _repo.AddAsync(entity);
            var item = _mapper.Map<PointMilestoneItemDto>(entity);

            return new ApiResponse<PointMilestoneItemDto>(item, true, "Tạo mốc điểm thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<PointMilestoneItemDto>> UpdateAsync(PointMilestoneUpdateDto dto, string accountId)
        {
            var entity = await _repo.GetByIdAsync(dto.Id)
                ?? throw new ApiException("Mốc điểm không tồn tại", StatusCodes.Status404NotFound);

            _mapper.Map(dto, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = accountId;

            await _repo.UpdateAsync(entity);
            var item = _mapper.Map<PointMilestoneItemDto>(entity);

            return new ApiResponse<PointMilestoneItemDto>(item, true, "Cập nhật thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<bool>> DeleteAsync(string id, string accountId)
        {
            await _repo.SoftDeleteAsync(id, accountId, DateTime.UtcNow);
            return new ApiResponse<bool>(true, true, "Xoá thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<IEnumerable<PointMilestoneItemDto>>> GetAllAsync()
        {
            var entities = await _repo.GetAllAsync();
            if (entities == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var dtos = _mapper.Map<IEnumerable<PointMilestoneItemDto>>(entities);
            return new ApiResponse<IEnumerable<PointMilestoneItemDto>>(dtos, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<IEnumerable<PointMilestoneItemDto>>> GetAllCreditAsync()
        {
            var entities = await _repo.GetAllCreditAsync();
            if (entities == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var dtos = _mapper.Map<IEnumerable<PointMilestoneItemDto>>(entities);
            return new ApiResponse<IEnumerable<PointMilestoneItemDto>>(dtos, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<IEnumerable<PointMilestoneItemDto>>> GetAllAccumulatedAsync()
        {
            var entities = await _repo.GetAllAccumulatedAsync();
            if (entities == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var dtos = _mapper.Map<IEnumerable<PointMilestoneItemDto>>(entities);
            return new ApiResponse<IEnumerable<PointMilestoneItemDto>>(dtos, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<PointMilestoneItemDto>> GetByIdAsync(string id)
        {
            var entity = await _repo.GetByIdAsync(id)
                ?? throw new ApiException("Mốc điểm không tồn tại", StatusCodes.Status404NotFound);

            var dto = _mapper.Map<PointMilestoneItemDto>(entity);
            return new ApiResponse<PointMilestoneItemDto>(dto, true, "OK", StatusCodes.Status200OK);
        }
    }
}
