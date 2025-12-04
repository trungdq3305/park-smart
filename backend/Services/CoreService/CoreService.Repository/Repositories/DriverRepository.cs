using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
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
    public class DriverRepository : IDriverRepository
    {
        private readonly IMongoCollection<Driver> _collection;

        public DriverRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _collection = database.GetCollection<Driver>("Driver");
        }

        public async Task<Driver?> GetByIdAsync(string id) =>
            await _collection.Find(e => e.Id == id && e.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<IEnumerable<Driver>> GetAllAsync() =>
            await _collection.Find(e => e.DeletedAt == null).ToListAsync();

        public async Task AddAsync(Driver entity) =>
            await _collection.InsertOneAsync(entity);

        public async Task UpdateAsync(Driver entity) =>
            await _collection.ReplaceOneAsync(e => e.Id == entity.Id, entity);

        public async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(e => e.Id == id);
        public async Task<Driver?> GetByAccountIdAsync(string accountId) =>
    await _collection.Find(d => d.AccountId == accountId && d.DeletedAt == null).FirstOrDefaultAsync();
        public async Task<bool> UpdateCreditPointByAccountIdAsync(string accountId, int creditPointDelta)
        {
            // 1. Tìm tài xế chưa bị xóa dựa trên AccountId và lấy tài liệu hiện tại
            var filter = Builders<Driver>.Filter.Eq(d => d.AccountId, accountId) &
                         Builders<Driver>.Filter.Eq(d => d.DeletedAt, null);

            // Lấy tài liệu hiện tại
            var driver = await _collection.Find(filter).FirstOrDefaultAsync();

            if (driver == null)
            {
                // Không tìm thấy tài xế
                return false;
            }

            // 2. Tính toán điểm mới và áp dụng giới hạn 100
            int currentCreditPoint = driver.CreditPoint;
            int newCreditPoint = currentCreditPoint + creditPointDelta;

            // Áp dụng quy tắc: điểm mới không được vượt quá 100
            if (newCreditPoint > 100)
            {
                newCreditPoint = 100;
            }

            // Nếu điểm mới không thay đổi, ta không cần cập nhật
            if (newCreditPoint == currentCreditPoint)
            {
                return true;
            }

            // 3. Cập nhật điểm CreditPoint đã được giới hạn
            var update = Builders<Driver>.Update
                .Set(d => d.CreditPoint, newCreditPoint) // <-- Set điểm mới đã được giới hạn
                .Set(d => d.UpdatedAt, TimeConverter.ToVietnamTime(DateTime.UtcNow));

            var result = await _collection.UpdateOneAsync(filter, update);

            // Trả về true nếu có 1 tài liệu được tìm thấy và cập nhật
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }
    }
}
