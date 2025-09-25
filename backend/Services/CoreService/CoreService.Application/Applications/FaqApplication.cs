using AutoMapper;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.CommentDtos;
using CoreService.Application.DTOs.FaqDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{

    public class FaqApplication : IFaqApplication
    {
        private readonly IFaqRepository _repo;
        private readonly IMapper _mapper;
        private readonly AccountDisplayHelper _display;
        private readonly IFaqStatusRepository _statusRepo;

        public FaqApplication(IFaqRepository repo, IMapper mapper, AccountDisplayHelper display, IFaqStatusRepository statusRepo)
        {
            _repo = repo;
            _mapper = mapper;
            _display = display;
            _statusRepo = statusRepo;
        }

        public async Task<ApiResponse<FaqResponseDto>> CreateAsync(FaqCreateDto dto, string accountId)
        {
            var pendingStatus = await _statusRepo.GetByNameAsync("Pending");
            var entity = new Faq
            {
                AccountId = accountId,
                Question = dto.Question?.Trim(),
                Answer = dto.Answer?.Trim(),
                CreatedBy = accountId,
                FaqStatusId = pendingStatus.Id
            };
            await _repo.AddAsync(entity);

            var (name, role) = await _display.ResolveAsync(accountId);
            var resp = _mapper.Map<FaqResponseDto>(entity);
            resp.CreatorName = name;
            resp.CreatorRole = role;

            return new ApiResponse<FaqResponseDto>(resp, true, "FAQ đã được tạo, chờ Admin duyệt", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<FaqResponseDto>> UpdateAsync(FaqUpdateDto dto, string accountId)
        {
            var entity = await _repo.GetByIdAsync(dto.Id)
                ?? throw new ApiException("FAQ không tồn tại", StatusCodes.Status404NotFound);
            var pendingStatus = await _statusRepo.GetByNameAsync("Pending");
            entity.Question = dto.Question?.Trim();
            entity.Answer = dto.Answer?.Trim();
            entity.FaqStatusId = pendingStatus.Id;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = accountId;

            await _repo.UpdateAsync(entity);

            var (name, role) = await _display.ResolveAsync(entity.AccountId);
            var resp = _mapper.Map<FaqResponseDto>(entity);
            resp.CreatorName = name;
            resp.CreatorRole = role;

            return new ApiResponse<FaqResponseDto>(resp, true, "Cập nhật FAQ thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<bool>> DeleteAsync(string id, string accountId)
        {
            await _repo.SoftDeleteAsync(id, accountId);
            return new ApiResponse<bool>(true, true, "Xoá FAQ thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<PaginationDto<FaqResponseDto>>> GetPagedAsync(int? page, int? pageSize)
        {
            var all = await _repo.GetAllAsync();
            var list = all.ToList();

            var dtos = list.Select(x => _mapper.Map<FaqResponseDto>(x)).ToList();
            // enrich name/role
            for (int i = 0; i < dtos.Count; i++)
            {
                var (name, role) = await _display.ResolveAsync(list[i].AccountId);
                dtos[i].CreatorName = name;
                dtos[i].CreatorRole = role;
            }

            var paged = PaginationDto<FaqResponseDto>.Create(dtos, page, pageSize);
            return new ApiResponse<PaginationDto<FaqResponseDto>>(paged, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<FaqResponseDto>> GetByIdAsync(string id)
        {
            var entity = await _repo.GetByIdAsync(id)
                ?? throw new ApiException("FAQ không tồn tại", StatusCodes.Status404NotFound);

            var dto = _mapper.Map<FaqResponseDto>(entity);
            var (name, role) = await _display.ResolveAsync(entity.AccountId);
            dto.CreatorName = name;
            dto.CreatorRole = role;

            return new ApiResponse<FaqResponseDto>(dto, true, "OK", StatusCodes.Status200OK);
        }
        public async Task<ApiResponse<Faq>> ApproveAsync(string faqId, string adminId)
        {
            var faq = await _repo.GetByIdAsync(faqId)
                ?? throw new ApiException("FAQ không tồn tại", StatusCodes.Status404NotFound);

            var approvedStatus = await _statusRepo.GetByNameAsync("Approved");

            faq.FaqStatusId = approvedStatus.Id;
            faq.UpdatedAt = DateTime.UtcNow;
            faq.UpdatedBy = adminId;

            await _repo.UpdateAsync(faq);
            return new ApiResponse<Faq>(faq, true, "FAQ đã được duyệt", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<Faq>> RejectAsync(FaqRejectDto dto, string adminId)
        {
            var faq = await _repo.GetByIdAsync(dto.Id)
                ?? throw new ApiException("FAQ không tồn tại", StatusCodes.Status404NotFound);

            var rejectedStatus = await _statusRepo.GetByNameAsync("Rejected");
            faq.RejectReason = dto.RejectReason?.Trim();
            faq.FaqStatusId = rejectedStatus.Id;
            faq.UpdatedAt = DateTime.UtcNow;
            faq.UpdatedBy = adminId;

            await _repo.UpdateAsync(faq);
            return new ApiResponse<Faq>(faq, true, "FAQ đã bị từ chối", StatusCodes.Status200OK);
        }
        public async Task<ApiResponse<PaginationDto<FaqResponseDto>>> GetByStatusAsync(string status, int? page, int? pageSize)
        {
            // Cho phép truyền status là Id hoặc StatusName
            string? statusId = status;

            // Nếu không phải ObjectId hợp lệ thì coi như là tên → tra id
            if (!ObjectId.TryParse(status, out _))
            {
                var st = await _statusRepo.GetByNameAsync(status);
                if (st == null) throw new ApiException("Status không tồn tại", StatusCodes.Status404NotFound);
                statusId = st.Id;
            }

            var items = await _repo.GetByStatusAsync(statusId!);
            var dtoList = _mapper.Map<IEnumerable<FaqResponseDto>>(items);

            var paged = PaginationDto<FaqResponseDto>.Create(dtoList, page, pageSize);
            return new ApiResponse<PaginationDto<FaqResponseDto>>(paged, true, "Lấy FAQ theo trạng thái thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<PaginationDto<FaqResponseDto>>> GetMineAsync(string accountId, int? page, int? pageSize)
        {
            var items = await _repo.GetByAccountAsync(accountId);
            var dtoList = _mapper.Map<IEnumerable<FaqResponseDto>>(items);

            var paged = PaginationDto<FaqResponseDto>.Create(dtoList, page, pageSize);
            return new ApiResponse<PaginationDto<FaqResponseDto>>(paged, true, "Lấy FAQ của tôi thành công", StatusCodes.Status200OK);
        }
    }
}
