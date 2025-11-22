using AutoMapper;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.CommentDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
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
    public class CommentApplication : ICommentApplication
    {
        private readonly ICommentRepository _repo;
        private readonly IMapper _mapper;
        private readonly AccountDisplayHelper _display;

        public CommentApplication(ICommentRepository repo, IMapper mapper, AccountDisplayHelper display)
        {
            _repo = repo;
            _mapper = mapper;
            _display = display;
        }

        public async Task<ApiResponse<CommentItemDto>> CreateAsync(CommentCreateDto dto, string accountId)
        {
            var type = ParseType(dto.TargetType);
            if (dto.ParentId == null)
            {
                var entity = new Comment
                {
                    TargetType = type,
                    TargetId = dto.TargetId,
                    Content = dto.Content?.Trim(),
                    Star = dto.ParentId == null ? dto.Star : null,
                    AccountId = accountId,
                    CreatedBy = accountId
                };
                await _repo.AddAsync(entity);

                var item = await MapToItem(entity);
                return new ApiResponse<CommentItemDto>(item, true, "Tạo bình luận thành công", StatusCodes.Status201Created);
            }
            else
            {
                
                var entity = new Comment
                {
                    TargetType = type,
                    TargetId = dto.TargetId,
                    ParentId = dto.ParentId,
                    Content = dto.Content?.Trim(),
                    Star = dto.ParentId == null ? dto.Star : null,
                    AccountId = accountId,
                    CreatedBy = accountId
                };

                await _repo.AddAsync(entity);

                var item = await MapToItem(entity);
                return new ApiResponse<CommentItemDto>(item, true, "Trả lời bình luận thành công", StatusCodes.Status201Created);
            }
            
        }

        public async Task<ApiResponse<CommentItemDto>> UpdateAsync(CommentUpdateDto dto, string accountId)
        {
            var entity = await _repo.GetByIdAsync(dto.Id)
                ?? throw new ApiException("Bình luận không tồn tại", StatusCodes.Status404NotFound);

            entity.Content = dto.Content?.Trim();
            if (entity.ParentId == null) entity.Star = dto.Star;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = accountId;

            await _repo.UpdateAsync(entity);
            var item = await MapToItem(entity);
            return new ApiResponse<CommentItemDto>(item, true, "Cập nhật bình luận thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<bool>> DeleteAsync(string id, string accountId)
        {
            await _repo.SoftDeleteAsync(id, accountId);
            return new ApiResponse<bool>(true, true, "Xoá bình luận thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<PaginationDto<CommentItemDto>>> GetByParkingLotAsync(string parkingLotId, int? page, int? pageSize)
        {
            var all = (await _repo.GetByTargetAsync(CommentTargetType.ParkingLot, parkingLotId)).ToList();
            if (all == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            return await BuildPagedTree(all, page, pageSize);
        }

        public async Task<ApiResponse<PaginationDto<CommentItemDto>>> GetByFaqAsync(string faqId, int? page, int? pageSize)
        {
            var all = (await _repo.GetByTargetAsync(CommentTargetType.Faq, faqId)).ToList();
            if (all == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }

            return await BuildPagedTree(all, page, pageSize);
        }

        // ===== helpers =====
        private async Task<ApiResponse<PaginationDto<CommentItemDto>>> BuildPagedTree(
            List<Comment> all, int? page, int? pageSize)
        {
            var roots = all.Where(x => string.IsNullOrEmpty(x.ParentId)).OrderBy(x => x.CreatedAt).ToList();

            var rootDtos = new List<CommentItemDto>();
            foreach (var r in roots) rootDtos.Add(await MapToItem(r));

            var paged = PaginationDto<CommentItemDto>.Create(rootDtos, page, pageSize);

            foreach (var item in paged.Data)
                item.Replies = await BuildReplies(all, item.Id);

            return new ApiResponse<PaginationDto<CommentItemDto>>(paged, true, "OK", StatusCodes.Status200OK);
        }

        private async Task<List<CommentItemDto>> BuildReplies(List<Comment> all, string parentId)
        {
            var children = all.Where(x => x.ParentId == parentId).OrderBy(x => x.CreatedAt).ToList();
            var list = new List<CommentItemDto>();
            foreach (var c in children)
            {
                var item = await MapToItem(c);
                item.Replies = await BuildReplies(all, c.Id);
                list.Add(item);
            }
            return list;
        }

        private async Task<CommentItemDto> MapToItem(Comment c)
        {
            var dto = _mapper.Map<CommentItemDto>(c);
            dto.TargetType = c.TargetType.ToString();
            var (name, role) = await _display.ResolveAsync(c.AccountId);
            dto.CreatorName = name; dto.CreatorRole = role;
            return dto;
        }

        private static CommentTargetType ParseType(string s)
        {
            return s?.Trim().ToLower() switch
            {
                "faq" => CommentTargetType.Faq,
                "parkinglot" => CommentTargetType.ParkingLot,
                _ => throw new ApiException("TargetType không hợp lệ (Faq|ParkingLot)", StatusCodes.Status400BadRequest)
            };
        }
    }
}
