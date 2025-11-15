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
    public class PaymentRecordRepo : IPaymentRecordRepo
    {
        private readonly IMongoCollection<PaymentRecord> _col;

        public PaymentRecordRepo(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _col = db.GetCollection<PaymentRecord>("PaymentRecord");

            // indexes
            var idx = new[]
            {
                new CreateIndexModel<PaymentRecord>(
                    Builders<PaymentRecord>.IndexKeys.Ascending(x=>x.XenditInvoiceId),
                    new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<PaymentRecord>(
                    Builders<PaymentRecord>.IndexKeys.Ascending(x=>x.ExternalId),
                    new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<PaymentRecord>(
                    Builders<PaymentRecord>.IndexKeys.Ascending(x=>x.OperatorId).Descending(x=>x.CreatedAt)),
                new CreateIndexModel<PaymentRecord>(
                    Builders<PaymentRecord>.IndexKeys.Ascending(x=>x.ReservationId))
            };
            _ = _col.Indexes.CreateMany(idx);
        }

        public Task AddAsync(PaymentRecord entity) => _col.InsertOneAsync(entity);

        public Task UpdateAsync(PaymentRecord entity) =>
            _col.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public async Task<PaymentRecord?> GetByIdAsync(string id) =>
            await _col.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<PaymentRecord?> GetByInvoiceIdAsync(string xenditInvoiceId) =>
            await _col.Find(x => x.XenditInvoiceId == xenditInvoiceId).FirstOrDefaultAsync();

        public async Task<PaymentRecord?> GetByExternalIdAsync(string externalId) =>
            await _col.Find(x => x.ExternalId == externalId).FirstOrDefaultAsync();

        public async Task<IEnumerable<PaymentRecord>> GetByOperatorAsync(string operatorId, int take = 50) =>
            await _col.Find(x => x.OperatorId == operatorId)
                      .SortByDescending(x => x.CreatedAt)
                      .Limit(take)
                      .ToListAsync();

        public async Task<IEnumerable<PaymentRecord>> GetByReservationAsync(string reservationId) =>
            await _col.Find(x => x.ReservationId == reservationId)
                      .SortByDescending(x => x.CreatedAt)
                      .ToListAsync();

        public async Task<PaymentRecord?> GetLatestByReservationIdAsync(string reservationId) =>
        await _col.Find(x => x.ReservationId == reservationId || x.SubscriptionId == reservationId || x.ParkingLotSessionId == reservationId)
                  .SortByDescending(x => x.CreatedAt)
                  .FirstOrDefaultAsync();

        public async Task<PaymentRecord?> GetLatestByReservationAsync(string operatorId, string reservationId) =>
            await _col.Find(x => x.OperatorId == operatorId && x.ReservationId == reservationId)
                      .SortByDescending(x => x.CreatedAt)
                      .FirstOrDefaultAsync();
        public async Task<IEnumerable<PaymentRecord>> GetByCreatedByAsync(string accountId, int take = 50) =>
    await _col.Find(x => x.CreatedBy == accountId)
              .SortByDescending(x => x.CreatedAt)
              .Limit(take)
              .ToListAsync();

        public async Task<IEnumerable<PaymentRecord>> GetByTypeAndStatusAsync(
    string operatorId,
    PaymentType type,
    IEnumerable<string> statuses)
        {
            // Tạo bộ lọc chính
            var filterBuilder = Builders<PaymentRecord>.Filter;

            // 1. Lọc theo Operator ID
            var filterOperator = filterBuilder.Eq(x => x.OperatorId, operatorId);

            // 2. Lọc theo Payment Type (Ví dụ: Subscription)
            var filterType = filterBuilder.Eq(x => x.PaymentType, type);

            // 3. Lọc theo Status (Ví dụ: PENDING, EXPIRED)
            // $in: Tìm các bản ghi mà trường Status nằm trong danh sách statuses
            var filterStatus = filterBuilder.In(x => x.Status, statuses);

            // Kết hợp tất cả các bộ lọc bằng AND
            var combinedFilter = filterBuilder.And(filterOperator, filterType, filterStatus);

            return await _col.Find(combinedFilter)
                             .SortByDescending(x => x.CreatedAt)
                             .ToListAsync();
        }
        public async Task<IEnumerable<PaymentRecord>> GetByCreatedByAndStatusAsync(
    string accountId,
    string status,
    int take = 50)
        {
            // Tạo filter cho cả CreatedBy và Status
            var filter = Builders<PaymentRecord>.Filter.Eq(x => x.CreatedBy, accountId) &
                         Builders<PaymentRecord>.Filter.Eq(x => x.Status, status);

            return await _col.Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Limit(take)
                .ToListAsync();
        }
    }
}
