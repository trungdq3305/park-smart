using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Mongo;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Repositories
{
    public class SubscriptionPlanRepository : ISubscriptionPlanRepository
    {
        // Tên Collection trong MongoDB sẽ là "SubscriptionPlan"
        private readonly IMongoCollection<SubscriptionPlan> _plans;

        public SubscriptionPlanRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);

            // Khởi tạo Collection cho SubscriptionPlan
            _plans = database.GetCollection<SubscriptionPlan>("SubscriptionPlan");
        }

        // --- CRUD Cơ bản ---

        public async Task<SubscriptionPlan?> GetByIdAsync(string id) =>
            await _plans.Find(p => p.Id == id).FirstOrDefaultAsync();

        public async Task<IEnumerable<SubscriptionPlan>> GetAllAsync() =>
            await _plans.Find(_ => true).ToListAsync(); // Lấy tất cả

        public async Task AddAsync(SubscriptionPlan plan) =>
            await _plans.InsertOneAsync(plan);

        public async Task UpdateAsync(SubscriptionPlan plan) =>
            await _plans.ReplaceOneAsync(p => p.Id == plan.Id, plan);

        public async Task DeleteAsync(string id) =>
            await _plans.DeleteOneAsync(p => p.Id == id);


        // --- Phương thức truy vấn nghiệp vụ ---

        /// <summary>
        /// Lấy gói phí mặc định và đang hoạt động.
        /// (Giả định: Có một trường IsDefault trong mô hình hoặc dùng Name để định danh)
        /// </summary>
        public async Task<SubscriptionPlan?> GetDefaultActivePlanAsync()
        {
            // Tùy chọn 1: Dựa vào tên mặc định và trạng thái Active
            return await _plans.Find(p => p.Name == "Standard Monthly Fee" && p.IsActive == true)
                               .FirstOrDefaultAsync();

            /*
            // Tùy chọn 2: Nếu bạn thêm trường IsDefault vào mô hình SubscriptionPlan
            return await _plans.Find(p => p.IsDefault == true && p.IsActive == true)
                               .FirstOrDefaultAsync();
            */
        }
    }
}
