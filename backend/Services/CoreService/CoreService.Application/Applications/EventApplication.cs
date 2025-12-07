using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.EventDtos;
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
    public class EventApplication : IEventApplication
    {
        private readonly IEventRepository _repo;
        private readonly IAccountApplication _accountApp;
        private readonly IPromotionRepository _promoRepo; // <<< THÊM
        public EventApplication(IEventRepository repo, IAccountApplication accountApp, IPromotionRepository promoRepo)
        {
            _repo = repo;
            _accountApp = accountApp;
            _promoRepo = promoRepo;
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
            var dto = await MapToResponseDto(entity); // <<< CẬP NHẬT
            return new ApiResponse<EventResponseDto>(dto, true, "OK", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<EventResponseDto>>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            if (items == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }

            // Áp dụng MapToResponseDto bất đồng bộ
            var tasks = items.Select(MapToResponseDto);
            var list = (await Task.WhenAll(tasks)).ToList(); // <<< CẬP NHẬT

            return new ApiResponse<List<EventResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }
        // CoreService.Application.Applications.EventApplication

        public async Task<ApiResponse<List<EventResponseDto>>> GetByAccIdAsync(string accid)
        {
            var items = await _repo.GetByCreatedByAsync(accid);

            // Nếu không có dữ liệu, trả về danh sách rỗng (200 OK) thay vì lỗi 401
            if (items == null || !items.Any())
            {
                // Bạn có thể chọn trả về danh sách rỗng kèm thông báo nhẹ nhàng hơn.
                return new ApiResponse<List<EventResponseDto>>(new List<EventResponseDto>(), true, "Không có sự kiện nào được tạo bởi tài khoản này.", StatusCodes.Status200OK);
            }

            // Sử dụng MapToResponseDto bất đồng bộ
            var tasks = items.Select(MapToResponseDto);
            var list = (await Task.WhenAll(tasks)).ToList(); // <<< CẬP NHẬT: Dùng Task.WhenAll

            return new ApiResponse<List<EventResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        // CoreService.Application.Applications.EventApplication

        public async Task<ApiResponse<List<EventResponseDto>>> GetUpcomingAsync()
        {
            var items = await _repo.GetUpcomingEventsAsync();

            // Nếu không có dữ liệu, trả về danh sách rỗng (200 OK) thay vì lỗi 401
            if (items == null || !items.Any())
            {
                // Bạn có thể chọn trả về danh sách rỗng kèm thông báo nhẹ nhàng hơn.
                return new ApiResponse<List<EventResponseDto>>(new List<EventResponseDto>(), true, "Hiện không có sự kiện sắp diễn ra.", StatusCodes.Status200OK);
            }

            // Sử dụng MapToResponseDto bất đồng bộ
            var tasks = items.Select(MapToResponseDto);
            var list = (await Task.WhenAll(tasks)).ToList(); // <<< CẬP NHẬT: Dùng Task.WhenAll

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
        // CoreService.Application.Applications.EventApplication

        // Thay thế Map tĩnh bằng MapToResponseDto async
        private async Task<EventResponseDto> MapToResponseDto(Event x)
        {
            var dto = new EventResponseDto
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
                UpdatedBy = x.UpdatedBy,
                Promotions = new List<PromotionResponseDto>() // Khởi tạo rỗng
            };

            // Chỉ lấy Promotions nếu sự kiện cho phép
            if (x.IncludedPromotions)
            {
                // Sử dụng PromotionRepository để lấy các khuyến mãi liên quan đến EventId này
                var promoEntities = await _promoRepo.GetByEventIdAsync(x.Id); // Phương thức này cần được thêm vào IPromotionRepository/PromotionRepository

                // Cần ánh xạ Promotion Entity sang PromotionResponseDto.
                // TÔI GIẢ ĐỊNH BẠN CÓ PHƯƠNG THỨC ÁNH XẠ KHUYẾN MÃI Ở ĐÂY HOẶC CHỈ CẦN CÁC THÔNG TIN CƠ BẢN.
                // Vì PromotionApplication đã có logic Map phức tạp, ở đây tôi sẽ ánh xạ đơn giản các trường cơ bản.
                // Tối ưu nhất là EventApplication không nên gọi trực tiếp repo của Promotion.
                // Tuy nhiên, theo yêu cầu, tôi sẽ giả định có một phương thức GetByEventIdAsync đơn giản.

                if (promoEntities != null)
                {
                    dto.Promotions = promoEntities.Select(p => new PromotionResponseDto
                    {
                        Id = p.Id,
                        Code = p.Code,
                        Name = p.Name,
                        DiscountType = p.DiscountType,
                        DiscountValue = p.DiscountValue,
                        MaxDiscountAmount = p.MaxDiscountAmount,
                        // ... chỉ gán các trường cần thiết để tránh vòng lặp tham chiếu và truy vấn đệ quy
                    }).ToList();
                }
            }

            return dto;
        }
        // XÓA PHƯƠNG THỨC MAP STATIC CŨ
    }
}
