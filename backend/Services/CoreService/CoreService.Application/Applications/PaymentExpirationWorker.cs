using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
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
    public class PaymentExpirationWorker : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<PaymentExpirationWorker> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Chạy mỗi 5 phút

        public PaymentExpirationWorker(IServiceProvider services, ILogger<PaymentExpirationWorker> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Payment Expiration Worker đang bắt đầu...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _services.CreateScope())
                    {
                        var payRepo = scope.ServiceProvider.GetRequiredService<IPaymentRecordRepo>();

                        // Mốc thời gian: Những hóa đơn tạo cách đây hơn 10 phút
                        var threshold = TimeConverter.ToVietnamTime(DateTime.UtcNow).AddMinutes(-10);

                        // Các loại cần quét
                        var typesToWatch = new[] {
                            PaymentType.Reservation,
                            PaymentType.Subscription,
                            PaymentType.ParkingLotSession
                        };

                        var expiredCount = await payRepo.UpdateExpiredPaymentsAsync(threshold, typesToWatch);

                        if (expiredCount > 0)
                        {
                            _logger.LogInformation("✅ Đã cập nhật {Count} giao dịch sang trạng thái EXPIRED.", expiredCount);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Lỗi khi chạy Cron Job cập nhật trạng thái hết hạn.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }
    }
}
