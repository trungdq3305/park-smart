using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class SubscriptionPlanApplication : ISubscriptionPlanApplication
    {
        private readonly ISubscriptionPlanRepository _planRepo;
        private const string DEFAULT_PLAN_NAME = "Standard Monthly Fee"; // Giả định

        public SubscriptionPlanApplication(ISubscriptionPlanRepository planRepo)
        {
            _planRepo = planRepo;
        }

        private async Task<SubscriptionPlan> GetPlanOrThrow()
        {
            var plan = await _planRepo.GetDefaultActivePlanAsync();

            if (plan == null)
            {
                // Thay vì Not Found, chúng ta thông báo cần tạo gói phí mặc định
                throw new ApiException($"Không tìm thấy gói phí mặc định '{DEFAULT_PLAN_NAME}' đang hoạt động. Vui lòng tạo bản ghi gói phí đầu tiên.", StatusCodes.Status404NotFound);
            }
            return plan;
        }

        public async Task<SubscriptionPlan> GetCurrentDefaultPlanAsync()
        {
            return await GetPlanOrThrow();
        }

        public async Task UpdateDefaultPlanAsync(SubscriptionPlanUpdateDto dto)
        {
            var plan = await GetPlanOrThrow(); // Lấy gói phí hiện tại

            // Mapping thủ công (hoặc dùng AutoMapper)
            plan.Name = dto.Name; // Giữ lại cho mục đích hiển thị
            plan.Description = dto.Description;
            plan.MonthlyFeeAmount = dto.MonthlyFeeAmount;
            plan.BillingDayOfMonth = dto.BillingDayOfMonth;
            plan.GracePeriodDays = dto.GracePeriodDays;
            plan.PenaltyFeeAmount = dto.PenaltyFeeAmount;
            plan.MaxOverdueMonthsBeforeSuspension = dto.MaxOverdueMonthsBeforeSuspension;
            plan.IsActive = dto.IsActive;
            plan.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            await _planRepo.UpdateAsync(plan);
        }
        public class SubscriptionPlanUpdateDto
        {
            [Required]
            public string Name { get; set; }
            public string? Description { get; set; }

            [Range(0, long.MaxValue)]
            public long MonthlyFeeAmount { get; set; }

            [Range(1, 28)]
            public int BillingDayOfMonth { get; set; }

            [Range(1, 31)]
            public int GracePeriodDays { get; set; }

            [Range(0, long.MaxValue)]
            public long PenaltyFeeAmount { get; set; }

            [Range(1, 12)]
            public int MaxOverdueMonthsBeforeSuspension { get; set; }

            public bool IsActive { get; set; }
        }
    }
}
