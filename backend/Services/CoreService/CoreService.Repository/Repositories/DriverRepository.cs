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
            // Tìm tài xế chưa bị xóa dựa trên AccountId
            var filter = Builders<Driver>.Filter.Eq(d => d.AccountId, accountId) &
                         Builders<Driver>.Filter.Eq(d => d.DeletedAt, null);

            // Sử dụng .Inc() để TĂNG điểm CreditPoint hiện tại lên một lượng là creditPointDelta
            // Đồng thời cập nhật trường UpdatedAt
            var update = Builders<Driver>.Update
                .Inc(d => d.CreditPoint, creditPointDelta) // <-- Thay đổi ở đây: Dùng Inc() để cộng
                .Set(d => d.UpdatedAt, TimeConverter.ToVietnamTime(DateTime.UtcNow));

            var result = await _collection.UpdateOneAsync(filter, update);

            // Trả về true nếu có 1 tài liệu được tìm thấy và cập nhật
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }
    }
}
