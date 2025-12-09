using CoreService.Repository.Interfaces;
using Dotnet.Shared.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class PromotionCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PromotionCleanupService> _logger;

        // Đặt khoảng thời gian quét: 24 giờ (hoặc tùy chỉnh)
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(24);

        public PromotionCleanupService(IServiceProvider serviceProvider, ILogger<PromotionCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Promotion Cleanup Service đang chạy.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Bắt đầu quét Promotion hết hạn...");

                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var promoRepo = scope.ServiceProvider.GetRequiredService<IPromotionRepository>();
                        var eventRepo = scope.ServiceProvider.GetRequiredService<IEventRepository>();

                        // Lấy thời gian hiện tại theo múi giờ Việt Nam để so sánh (như logic của bạn)
                        var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);

                        // 1. Lấy tất cả Promotions đang Active và EndDate đã qua
                        var expiredPromotions = await promoRepo.GetExpiredActivePromotionsAsync(now);

                        int count = 0;
                        foreach (var promo in expiredPromotions)
                        {
                            // Cần kiểm tra Event EndDate, do promotion hiện tại lấy EndDate từ Event
                            var eventEntity = await eventRepo.GetByIdAsync(promo.EventId);
                            if (eventEntity == null) continue; // Bỏ qua nếu Event bị xóa/không tìm thấy

                            // Chỉ cập nhật nếu EndDate của Event đã qua
                            if (now >= eventEntity.EndDate)
                            {
                                promo.IsActive = false;
                                promo.UpdatedAt = now;
                                await promoRepo.UpdateAsync(promo);
                                count++;
                            }
                        }
                        _logger.LogInformation($"Đã xử lý và khóa {count} khuyến mãi hết hạn.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi xảy ra trong quá trình Promotion Cleanup.");
                }

                // Chờ 24 giờ trước khi chạy lần tiếp theo
                await Task.Delay(CheckInterval, stoppingToken);
            }
        }
    }
}
