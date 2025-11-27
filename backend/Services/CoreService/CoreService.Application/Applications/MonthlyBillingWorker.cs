using CoreService.Application.Interfaces;
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
    public class MonthlyBillingWorker : BackgroundService
    {
        private readonly ILogger<MonthlyBillingWorker> _logger;
        private readonly IServiceProvider _serviceProvider;
        private static bool _hasRunThisMonth = false; // Flag để tránh chạy nhiều lần trong tháng

        public MonthlyBillingWorker(ILogger<MonthlyBillingWorker> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Chạy kiểm tra mỗi 1 giờ
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;

                // Đặt lại flag vào ngày 2 của mỗi tháng để sẵn sàng cho tháng sau
                if (now.Day > 1)
                {
                    _hasRunThisMonth = false;
                }

                // Điều kiện chạy: Ngày 1 của tháng VÀ chưa chạy trong tháng này (trước 2:00 AM)
                if (now.Day == 1 && now.Hour == 1 && _hasRunThisMonth == false)
                {
                    _logger.LogInformation("Worker: Bắt đầu Job thanh toán định kỳ...");

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        try
                        {
                            var billingService = scope.ServiceProvider.GetRequiredService<IBillingService>();
                            await billingService.RunMonthlyBillingAndSuspensionJobAsync();
                            _hasRunThisMonth = true; // Đánh dấu đã chạy thành công
                            _logger.LogInformation("Job thanh toán hoàn thành.");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Lỗi nghiêm trọng xảy ra trong quá trình tính phí hàng tháng.");
                        }
                    }
                }

                // Ngủ một giờ trước khi kiểm tra lại
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}
