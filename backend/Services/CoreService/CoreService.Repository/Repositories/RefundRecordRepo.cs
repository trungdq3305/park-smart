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
    public class RefundRecordRepo : IRefundRecordRepo
    {
        private readonly IMongoCollection<RefundRecord> _col;

        public RefundRecordRepo(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _col = db.GetCollection<RefundRecord>("RefundRecord");

            var idx = new[]
            {
                new CreateIndexModel<RefundRecord>(
                    Builders<RefundRecord>.IndexKeys.Ascending(x => x.XenditRefundId),
                    new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<RefundRecord>(
                    Builders<RefundRecord>.IndexKeys.Ascending(x => x.PaymentId))
            };
            _ = _col.Indexes.CreateMany(idx);
        }

        public Task AddAsync(RefundRecord entity) => _col.InsertOneAsync(entity);

        public Task UpdateAsync(RefundRecord entity) =>
            _col.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public async Task<RefundRecord?> GetByRefundIdAsync(string xenditRefundId) =>
            await _col.Find(x => x.XenditRefundId == xenditRefundId).FirstOrDefaultAsync();

        public async Task<IEnumerable<RefundRecord>> GetByPaymentAsync(string paymentRecordId) =>
            await _col.Find(x => x.PaymentId == paymentRecordId)
                      .SortByDescending(x => x.CreatedAt)
                      .ToListAsync();
        public async Task<IEnumerable<RefundRecord>> GetByCreatedByAsync(string accountId, int take = 50) =>
    await _col.Find(x => x.CreatedBy == accountId)
              .SortByDescending(x => x.CreatedAt)
              .Limit(take)
              .ToListAsync();
       
        public async Task<IEnumerable<RefundRecord>> GetByPaymentIdsAsync(IEnumerable<string> paymentRecordIds)
        {
            if (paymentRecordIds == null || !paymentRecordIds.Any())
            {
                return Enumerable.Empty<RefundRecord>();
            }

            // Sử dụng Builders<RefundRecord>.Filter.In để tìm các bản ghi có PaymentId nằm trong danh sách.
            // Lọc theo PaymentRecord ID
            var filter = Builders<RefundRecord>.Filter.In(x => x.PaymentId, paymentRecordIds);

            return await _col.Find(filter)
                             .SortByDescending(x => x.CreatedAt)
                             .ToListAsync();
        }
    }
}
