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
    public class DataCleanupService : BackgroundService
    {
        private readonly ILogger<DataCleanupService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _period = TimeSpan.FromHours(12); // Chạy mỗi 12 giờ

        public DataCleanupService(ILogger<DataCleanupService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Data Cleanup Service đang chạy.");

            using var timer = new PeriodicTimer(_period);

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                _logger.LogInformation($"Bắt đầu dọn dẹp dữ liệu lúc: {DateTime.Now}");

                // Scope để lấy DataConsistencyApplication instance mới cho mỗi lần chạy
                using (var scope = _serviceProvider.CreateScope())
                {
                    var cleanupApp = scope.ServiceProvider.GetRequiredService<DataConsistencyApplication>();

                    try
                    {
                        // Chạy bước 1: Xử lý Role mồ côi (Role không có Account)
                        await cleanupApp.CleanUpOrphanedRolesAsync();

                        // Chạy bước 2: Xử lý Account mồ côi (Account không có Role)
                        await cleanupApp.CleanUpOrphanedAccountsAsync();

                        _logger.LogInformation("Dọn dẹp dữ liệu hoàn tất thành công.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Lỗi trong quá trình dọn dẹp dữ liệu.");
                    }
                }
            }
        }
    }
}
