using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.PromotionDtos;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
using Microsoft.AspNetCore.Http;
using MongoDB.Bson;
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
        private readonly IUserPromotionUsageRepository _usageRepo;
        private readonly IAccountApplication _accountApplication;
        private readonly IEventRepository _eventRepository;
        private readonly IPaymentRecordRepo _paymentRecordRepo;
        public PromotionApplication(IPromotionRepository promoRepo, IPromotionRuleRepository ruleRepo, IUserPromotionUsageRepository usageRepo, IAccountApplication accountApplication, IEventRepository eventRepository, IPaymentRecordRepo paymentRecordRepo)
        {
            _promoRepo = promoRepo;
            _ruleRepo = ruleRepo;
            _usageRepo = usageRepo;
            _accountApplication = accountApplication;
            _eventRepository = eventRepository;
            _paymentRecordRepo = paymentRecordRepo;
        }

        public async Task<ApiResponse<PromotionResponseDto>> CreateAsync(PromotionCreateDto dto, string actorAccountId)
        {
            var existingCode = await _promoRepo.GetByCodeAsync(dto.Code);
            if (existingCode != null)
                throw new ApiException("Mã khuyến mãi đã tồn tại", StatusCodes.Status409Conflict);

            // 1. Lấy thông tin Event BẮT BUỘC
            var eventEntity = await _eventRepository.GetByIdAsync(dto.EventId)
                                ?? throw new ApiException("Sự kiện không tồn tại", StatusCodes.Status404NotFound);

            // 2. Kiểm tra Event có cho phép khuyến mãi
            if (!eventEntity.IncludedPromotions)
            {
                throw new ApiException("Sự kiện này không cho phép thêm khuyến mãi", StatusCodes.Status400BadRequest);
            }
            // --- LOGIC KIỂM TRA BỔ SUNG BẮT ĐẦU TẠI ĐÂY ---
            if (dto.DiscountType == DiscountType.Percentage)
            {
                // Kiểm tra DiscountValue phải là số phần trăm hợp lệ (ví dụ: 0 < Value <= 100)
                if (dto.DiscountValue <= 0 || dto.DiscountValue > 100)
                    throw new ApiException("Giá trị giảm giá (DiscountValue) cho chiết khấu phần trăm phải lớn hơn 0 và nhỏ hơn hoặc bằng 100", StatusCodes.Status400BadRequest);

                // MaxDiscountAmount phải tồn tại và lớn hơn 0
                if (!dto.MaxDiscountAmount.HasValue || dto.MaxDiscountAmount.Value <= 0)
                    throw new ApiException("Khuyến mãi theo phần trăm phải có giới hạn giảm giá tối đa (MaxDiscountAmount) lớn hơn 0", StatusCodes.Status400BadRequest);
            }
            else if (dto.DiscountType == DiscountType.FixedAmount)
            {
                // Kiểm tra DiscountValue phải lớn hơn 0
                if (dto.DiscountValue <= 0)
                    throw new ApiException("Giá trị giảm giá (DiscountValue) cho chiết khấu cố định phải lớn hơn 0", StatusCodes.Status400BadRequest);

                // MaxDiscountAmount không được có giá trị (null hoặc 0)
                if (dto.MaxDiscountAmount.HasValue && dto.MaxDiscountAmount.Value > 0)
                    throw new ApiException("Khuyến mãi theo số tiền cố định không được có giới hạn giảm giá tối đa (MaxDiscountAmount)", StatusCodes.Status400BadRequest);
            }
            
            var acc = await _accountApplication.GetByIdAsync(actorAccountId)
                ?? throw new ApiException("Tài khoản người tạo không tồn tại", StatusCodes.Status404NotFound);
            var operatorId = acc.Data.OperatorDetail.Id;

            var entity = new Promotion
            {
                Id = null,
                Code = dto.Code,
                Name = dto.Name,
                Description = dto.Description,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MaxDiscountAmount = dto.MaxDiscountAmount,
                StartDate = eventEntity.StartDate, // LẤY TỪ EVENT
                EndDate = eventEntity.EndDate,
                TotalUsageLimit = dto.TotalUsageLimit,
                IsActive = dto.IsActive,
                CreatedBy = actorAccountId,
                EventId =   dto.EventId,
                OperatorId = operatorId,
            };

            await _promoRepo.AddAsync(entity);
            var res = await MapToResponseDto(entity);
            return new ApiResponse<PromotionResponseDto>(res, true, "Tạo khuyến mãi thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<PromotionResponseDto>> UpdateAsync(PromotionUpdateDto dto, string actorAccountId)
        {
            var entity = await _promoRepo.GetByIdAsync(dto.Id)
                  ?? throw new ApiException("Khuyến mãi không tồn tại", StatusCodes.Status404NotFound);

            // 1. LẤY EVENT và KIỂM TRA NGÀY THÁNG CỦA EVENT
            var eventEntity = await _eventRepository.GetByIdAsync(entity.EventId)
                                ?? throw new ApiException("Sự kiện liên kết không tồn tại", StatusCodes.Status404NotFound);

            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            if (now >= eventEntity.StartDate)
                throw new ApiException("Không thể chỉnh sửa khuyến mãi đã bắt đầu (theo ngày sự kiện).", StatusCodes.Status400BadRequest);

            // 2. Xác định các giá trị sẽ được áp dụng
            var newDiscountType = dto.DiscountType ?? entity.DiscountType;
            var newDiscountValue = dto.DiscountValue ?? entity.DiscountValue;
            var newMaxDiscountAmount = dto.MaxDiscountAmount ?? entity.MaxDiscountAmount;

            // 3. KIỂM TRA LOGIC DISCOUNT (Giữ nguyên)
            if (newDiscountType == DiscountType.Percentage)
            {
                if (newDiscountValue <= 0 || newDiscountValue > 100)
                    throw new ApiException("Giá trị giảm giá (DiscountValue) cho chiết khấu phần trăm phải lớn hơn 0 và nhỏ hơn hoặc bằng 100", StatusCodes.Status400BadRequest);

                if (!newMaxDiscountAmount.HasValue || newMaxDiscountAmount.Value <= 0)
                    throw new ApiException("Khuyến mãi theo phần trăm phải có giới hạn giảm giá tối đa (MaxDiscountAmount) lớn hơn 0", StatusCodes.Status400BadRequest);
            }
            else if (newDiscountType == DiscountType.FixedAmount)
            {
                if (newDiscountValue <= 0)
                    throw new ApiException("Giá trị giảm giá (DiscountValue) cho chiết khấu cố định phải lớn hơn 0", StatusCodes.Status400BadRequest);

                if (newMaxDiscountAmount.HasValue && newMaxDiscountAmount.Value > 0)
                    throw new ApiException("Khuyến mãi theo số tiền cố định không được có giới hạn giảm giá tối đa (MaxDiscountAmount)", StatusCodes.Status400BadRequest);
            }

            // 4. GÁN CÁC GIÁ TRỊ VÀO ENTITY
            entity.Name = dto.Name ?? entity.Name;
            entity.Description = dto.Description ?? entity.Description;

            // Gán các giá trị đã kiểm tra
            entity.DiscountType = newDiscountType;
            entity.DiscountValue = newDiscountValue;
            entity.MaxDiscountAmount = newMaxDiscountAmount;

            // NGÀY THÁNG KHÔNG ĐƯỢC CẬP NHẬT TỪ DTO, LUÔN DỰA VÀO EVENT
            // Tuy nhiên, nếu Event được cập nhật, Promotion sẽ không tự động cập nhật theo.
            // Chúng ta sẽ KHÔNG thay đổi StartDate/EndDate ở đây, trừ khi bạn muốn update thủ công EventId.

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
            var entity = await _promoRepo.GetByIdAsync(id) ?? throw new ApiException("Khuyến mãi không tồn tại", StatusCodes.Status404NotFound);

            // LẤY EVENT và KIỂM TRA NGÀY THÁNG CỦA EVENT
            var eventEntity = await _eventRepository.GetByIdAsync(entity.EventId)
                                ?? throw new ApiException("Sự kiện liên kết không tồn tại", StatusCodes.Status404NotFound);

            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            if (now >= eventEntity.StartDate)
                throw new ApiException("Không thể xóa khuyến mãi đã bắt đầu (theo ngày sự kiện).", StatusCodes.Status400BadRequest);

            await _promoRepo.SoftDeleteAsync(id, actorAccountId, TimeConverter.ToVietnamTime(DateTime.UtcNow));
            return new ApiResponse<object>(null, true, "Xóa khuyến mãi thành công", StatusCodes.Status200OK);
        }

        // Cập nhật phương thức CalculateAsync để sử dụng ngày tháng của Event
        public async Task<ApiResponse<PromotionCalculateResponseDto>> CalculateAsync(PromotionCalculateRequestDto dto, string accId)
        {
            var promo = await _promoRepo.GetByCodeAsync(dto.PromotionCode)
                ?? throw new ApiException("Mã khuyến mãi không tồn tại", StatusCodes.Status404NotFound);

            if (!promo.IsActive)
                throw new ApiException("Mã khuyến mãi đã bị khóa", StatusCodes.Status400BadRequest);

            // LẤY EVENT để kiểm tra ngày tháng
            var eventEntity = await _eventRepository.GetByIdAsync(promo.EventId)
                                ?? throw new ApiException("Sự kiện liên kết không tồn tại", StatusCodes.Status404NotFound);

            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            // SỬ DỤNG NGÀY THÁNG CỦA EVENT
            if (now < eventEntity.StartDate || now > eventEntity.EndDate)
                throw new ApiException("Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu (theo ngày sự kiện)", 400);

            // ... (Phần kiểm tra Rule và tính toán giữ nguyên)
            var rules = await _ruleRepo.GetByPromotionIdAsync(promo.Id);
            foreach (var rule in rules)
            {
                if (rule.RuleType == PromotionRuleType.MinBookingValue)
                {
                    if (decimal.Parse(rule.RuleValue) > dto.OriginalAmount)
                        throw new ApiException("Chưa đạt giá trị tối thiểu để sử dụng mã", 400);
                }
            }

            decimal discountAmount = 0;

            if (promo.DiscountType == DiscountType.FixedAmount)
            {
                discountAmount = promo.DiscountValue;
            }
            else if (promo.DiscountType == DiscountType.Percentage)
            {
                discountAmount = dto.OriginalAmount * (promo.DiscountValue / 100);

                if (promo.MaxDiscountAmount.HasValue)
                    discountAmount = Math.Min(discountAmount, promo.MaxDiscountAmount.Value);
            }

            // Không bao giờ giảm quá amount gốc
            if (discountAmount > dto.OriginalAmount)
                discountAmount = dto.OriginalAmount;

            var finalAmount = dto.OriginalAmount - discountAmount;
            if (finalAmount < 0) finalAmount = 0;

            return new ApiResponse<PromotionCalculateResponseDto>(
                new PromotionCalculateResponseDto
                {
                    DiscountAmount = discountAmount,
                    FinalAmount = finalAmount
                },
                true,
                "Tính giá thành công",
                200
            );
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
            // 1. Kiểm tra sự tồn tại của khuyến mãi
            _ = await _promoRepo.GetByIdAsync(dto.PromotionId) ?? throw new ApiException("Khuyến mãi không tồn tại", StatusCodes.Status404NotFound);

            // 2. Kiểm tra xem đã có rule nào cho khuyến mãi này chưa
            var existingRules = await _ruleRepo.GetByPromotionIdAsync(dto.PromotionId);

            if (existingRules != null && existingRules.Any())
            {
                // Nếu đã có rule, ném lỗi với thông báo phù hợp
                throw new ApiException("Mỗi khuyến mãi chỉ được phép có 1 điều kiện (Rule) duy nhất.", StatusCodes.Status400BadRequest);
            }

            // 3. Nếu chưa có rule, tiến hành thêm rule mới
            var ruleEntity = new PromotionRule
            {
                PromotionId = dto.PromotionId,
                RuleType = dto.RuleType,
                RuleValue = dto.RuleValue
            };
            await _ruleRepo.AddAsync(ruleEntity);

            // 4. Trả về phản hồi thành công
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
            string eventTitle = null;

            // Lấy EventTitle nếu có EventId
            if (!string.IsNullOrEmpty(x.EventId))
            {
                var eventEntity = await _eventRepository.GetByIdAsync(x.EventId);
                eventTitle = eventEntity?.Title;
            }

            // Ánh xạ
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
                EventId = x.EventId,      // <<< Gán EventId
                EventTitle = eventTitle,  // <<< Gán EventTitle
                Rules = rules.Select(r => new PromotionRuleResponseDto
                {
                    Id = r.Id,
                    PromotionId = r.PromotionId,
                    RuleType = r.RuleType,
                    RuleValue = r.RuleValue
                }).ToList()
            };
        }
        
        public async Task<ApiResponse<object>> UsePromotionAsync(PromotionCalculateRequestDto dto, string accId)
        {
            var promo = await _promoRepo.GetByCodeAsync(dto.PromotionCode)
                ?? throw new ApiException("Mã khuyến mãi không tồn tại", 404);

            var calc = await CalculateAsync(dto,  accId);
            var amountFinal = calc.Data.FinalAmount;

            // Check total usage
            if (promo.CurrentUsageCount >= promo.TotalUsageLimit)
                throw new ApiException("Mã đã được sử dụng tối đa số lần cho phép", 400);

            // Check user usage
            var userUsed = await _usageRepo.CountUserUsageAsync(accId, promo.Id);
            if (userUsed >= 1)
                throw new ApiException("Bạn đã sử dụng mã này rồi", 400);

            // Lưu lịch sử sử dụng
            var usage = new UserPromotionUsage
            {
                AccountId = accId,
                PromotionId = promo.Id,
                EntityId = dto.EntiTyId, // Đơn hàng hoặc booking id sau này
                UsedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow),
                Status = UsageStatus.Used
            };

            await _usageRepo.AddAsync(usage);

            // Tăng usage count
            promo.CurrentUsageCount += 1;
            await _promoRepo.UpdateAsync(promo);

            return new ApiResponse<object>(
                new
                {
                    PromotionId = promo.Id,
                    PromotionCode = promo.Code,
                    EntityId = dto.EntiTyId,
                    OriginalAmount = dto.OriginalAmount,
                    FinalAmount = amountFinal,
                    DiscountAmount = calc.Data.DiscountAmount
                },
                true,
                "Áp dụng mã giảm giá thành công",
                200
            );
        }
        public async Task<ApiResponse<List<PromotionResponseDto>>> GetByOperatorIdAsync(string operatorId)
        {
            var items = await _promoRepo.GetByOperatorIdAsync(operatorId);

            if (items == null || !items.Any())
            {
                // Nếu không có dữ liệu, bạn có thể trả về danh sách rỗng hoặc throw ApiException tùy theo thiết kế của bạn.
                return new ApiResponse<List<PromotionResponseDto>>(new List<PromotionResponseDto>(), true, "Không có khuyến mãi nào được tạo bởi Operator này.", StatusCodes.Status200OK);
            }

            var tasks = items.Select(MapToResponseDto);
            var list = (await Task.WhenAll(tasks)).ToList();

            return new ApiResponse<List<PromotionResponseDto>>(list, true, "Lấy danh sách khuyến mãi theo Operator thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<object>> RefundPromotionUsageAsync(string paymentId, string actorAccountId)
        {
            // 1. Tìm bản ghi sử dụng liên quan đến EntityId (đơn hàng/booking)

            var paymentRecord = await _paymentRecordRepo.GetByIdAsync(paymentId)
                                 ?? throw new ApiException("Bản ghi thanh toán không tồn tại.", StatusCodes.Status404NotFound);
            var entityId = paymentRecord.ReservationId ?? paymentRecord.SubscriptionId ?? paymentRecord.ParkingLotSessionId;
            var usageEntity = await _usageRepo.GetByEntityIdAsync(entityId)
                              ?? throw new ApiException("Lịch sử sử dụng khuyến mãi không tồn tại.", StatusCodes.Status404NotFound);

            if (usageEntity.Status != UsageStatus.Used)
                throw new ApiException("Mã khuyến mãi đã được hoàn tiền/hủy trước đó.", StatusCodes.Status400BadRequest);

            // 2. Cập nhật trạng thái sử dụng
            usageEntity.Status = UsageStatus.Refunded;
            usageEntity.RefundedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            await _usageRepo.UpdateAsync(usageEntity); // Cần có phương thức Update trong usageRepo

            // 3. Giảm CurrentUsageCount của Promotion
            var promotion = await _promoRepo.GetByIdAsync(usageEntity.PromotionId)
                            ?? throw new ApiException("Khuyến mãi không tồn tại.", StatusCodes.Status404NotFound);

            if (promotion.CurrentUsageCount > 0)
            {
                promotion.CurrentUsageCount -= 1;
                promotion.UpdatedBy = actorAccountId;
                promotion.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
                await _promoRepo.UpdateAsync(promotion);
            }

            return new ApiResponse<object>(null, true, "Hoàn tác sử dụng khuyến mãi thành công.", StatusCodes.Status200OK);
        }
    }
}
