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

        // Trong PaymentRepository (hoặc lớp chứa hàm này)

        public async Task AddAsync(PaymentRecord entity)
        {
            try
            {
                // Thực hiện thao tác Insert
                await _col.InsertOneAsync(entity);
            }
            catch (MongoBulkWriteException<PaymentRecord> ex)
            {
                // 🚨 BẮT LỖI BULK WRITE (thường xảy ra cả với InsertOneAsync) 🚨
                // Ném lại lỗi để tầng Service có thể kiểm tra cụ thể.
                Console.WriteLine("--- LỖI BULK WRITE/DUPLICATE KEY MONGODB ---");
                Console.WriteLine($"Thông báo lỗi: {ex.Message}");

                // Ném lỗi lên trên để tầng service xử lý business logic
                throw;
            }
            catch (MongoDB.Bson.BsonSerializationException ex)
            {
                // 🚨 BẮT LỖI SERIALIZATION CỦA MONGODB 🚨
                Console.WriteLine("--- LỖI SERIALIZATION MONGODB RẤT CHI TIẾT ---");
                Console.WriteLine($"Thông báo lỗi: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                throw;
            }
            catch (Exception ex)
            {
                // Bắt các lỗi khác (ví dụ: lỗi kết nối, lỗi cấu hình index, etc.)
                Console.WriteLine("--- LỖI CHUNG KHÁC KHI THÊM PAYMENTRECORD ---");
                Console.WriteLine($"Thông báo lỗi: {ex.Message}");
                throw;
            }
        }

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
        public async Task<IEnumerable<PaymentRecord>> GetFilteredPaymentsAsync(
    string? operatorId,
    IEnumerable<PaymentType>? paymentTypes,
    string? status,
    DateTime? fromDate,
    DateTime? toDate)
        {
            var filterBuilder = Builders<PaymentRecord>.Filter;
            var filters = new List<FilterDefinition<PaymentRecord>>();

            if (!string.IsNullOrEmpty(operatorId))
                filters.Add(filterBuilder.Eq(x => x.OperatorId, operatorId));

            if (paymentTypes != null && paymentTypes.Any())
                filters.Add(filterBuilder.In(x => x.PaymentType, paymentTypes));

            if (!string.IsNullOrEmpty(status))
                filters.Add(filterBuilder.Eq(x => x.Status, status));

            if (fromDate.HasValue)
                filters.Add(filterBuilder.Gte(x => x.CreatedAt, fromDate.Value));

            if (toDate.HasValue)
                filters.Add(filterBuilder.Lte(x => x.CreatedAt, toDate.Value.AddDays(1).AddSeconds(-1))); // Đến cuối ngày

            var combinedFilter = filters.Any() ? filterBuilder.And(filters) : filterBuilder.Empty;

            return await _col.Find(combinedFilter)
                             .SortByDescending(x => x.CreatedAt)
                             .ToListAsync();
        }

        public async Task<long> CountFilteredPaymentsAsync(
            string? operatorId,
            IEnumerable<PaymentType>? paymentTypes,
            string? status,
            DateTime? fromDate,
            DateTime? toDate)
        {
            // Logic tạo filter tương tự như GetFilteredPaymentsAsync
            var filterBuilder = Builders<PaymentRecord>.Filter;
            var filters = new List<FilterDefinition<PaymentRecord>>();

            if (!string.IsNullOrEmpty(operatorId))
                filters.Add(filterBuilder.Eq(x => x.OperatorId, operatorId));

            if (paymentTypes != null && paymentTypes.Any())
                filters.Add(filterBuilder.In(x => x.PaymentType, paymentTypes));

            if (!string.IsNullOrEmpty(status))
                filters.Add(filterBuilder.Eq(x => x.Status, status));

            if (fromDate.HasValue)
                filters.Add(filterBuilder.Gte(x => x.CreatedAt, fromDate.Value));

            if (toDate.HasValue)
                filters.Add(filterBuilder.Lte(x => x.CreatedAt, toDate.Value.AddDays(1).AddSeconds(-1))); // Đến cuối ngày

            var combinedFilter = filters.Any() ? filterBuilder.And(filters) : filterBuilder.Empty;

            return await _col.CountDocumentsAsync(combinedFilter);
        }
        public async Task<PaymentRecord?> GetUnpaidMainInvoiceForMonth(string operatorId, DateTime invoiceMonth)
        {
            // Lấy ngày đầu tiên của tháng được truyền vào (ví dụ: 2025-12-01 00:00:00)
            var startDate = new DateTime(invoiceMonth.Year, invoiceMonth.Month, 1).Date;
            // Lấy ngày đầu tiên của tháng tiếp theo (ví dụ: 2026-01-01 00:00:00)
            var endDate = startDate.AddMonths(1);

            var unpaidStatuses = new[] { "CREATED", "PENDING", "EXPIRED" };

            var filter = Builders<PaymentRecord>.Filter.And(
                Builders<PaymentRecord>.Filter.Eq(p => p.OperatorId, operatorId),
                Builders<PaymentRecord>.Filter.Eq(p => p.PaymentType, PaymentType.OperatorCharge),
                // Lọc theo phạm vi tháng: InvoiceMonth >= startDate VÀ InvoiceMonth < endDate
                Builders<PaymentRecord>.Filter.Gte(p => p.InvoiceMonth, startDate),
                Builders<PaymentRecord>.Filter.Lt(p => p.InvoiceMonth, endDate),
                Builders<PaymentRecord>.Filter.In(p => p.Status, unpaidStatuses)
            );

            return await _col.Find(filter).FirstOrDefaultAsync();
        }
        public async Task<PaymentRecord?> GetMainInvoiceForMonth(string operatorId, DateTime invoiceMonth)
        {
            // Lấy ngày đầu tiên của tháng được truyền vào
            var startDate = new DateTime(invoiceMonth.Year, invoiceMonth.Month, 1).Date;
            // Lấy ngày đầu tiên của tháng tiếp theo
            var endDate = startDate.AddMonths(1);

            var filter = Builders<PaymentRecord>.Filter.And(
                Builders<PaymentRecord>.Filter.Eq(p => p.OperatorId, operatorId),
                Builders<PaymentRecord>.Filter.Eq(p => p.PaymentType, PaymentType.OperatorCharge),
                // Lọc theo phạm vi tháng: InvoiceMonth >= startDate VÀ InvoiceMonth < endDate
                Builders<PaymentRecord>.Filter.Gte(p => p.InvoiceMonth, startDate),
                Builders<PaymentRecord>.Filter.Lt(p => p.InvoiceMonth, endDate)
            );

            return await _col.Find(filter).FirstOrDefaultAsync();
        }
        /// <summary>
        /// 2. Tìm hóa đơn Phạt (PEN) liên quan đến một hóa đơn chính bị quá hạn.
        /// </summary>
        public async Task<PaymentRecord?> GetPenaltyInvoiceForRelatedInvoice(string relatedInvoiceId)
        {
            var filter = Builders<PaymentRecord>.Filter.And(
                Builders<PaymentRecord>.Filter.Eq(p => p.PaymentType, PaymentType.PenaltyCharge),
                Builders<PaymentRecord>.Filter.Eq(p => p.RelatedInvoiceId, relatedInvoiceId)
            );

            // Ta chỉ cần một bản ghi duy nhất, vì chỉ tạo 1 hóa đơn phạt cho 1 hóa đơn chính
            return await _col.Find(filter).FirstOrDefaultAsync();
        }

        /// <summary>
        /// 3. Kiểm tra xem Operator có bất kỳ hóa đơn (OPR/PEN) nào chưa thanh toán và đã quá hạn không.
        /// </summary>
        public async Task<bool> HasUnpaidOverdueInvoices(string operatorId)
        {
            var unpaidStatuses = new[] { "CREATED", "PENDING", "EXPIRED" };
            var now = DateTime.UtcNow; // Hoặc dùng TimeConverter.ToVietnamTime(DateTime.UtcNow);

            var filter = Builders<PaymentRecord>.Filter.And(
                Builders<PaymentRecord>.Filter.Eq(p => p.OperatorId, operatorId),
                // Chỉ check OPR và PEN
                Builders<PaymentRecord>.Filter.In(p => p.PaymentType, new[] { PaymentType.OperatorCharge, PaymentType.PenaltyCharge }),
                Builders<PaymentRecord>.Filter.In(p => p.Status, unpaidStatuses),
                // Chỉ kiểm tra những hóa đơn đã quá ngày đáo hạn
                Builders<PaymentRecord>.Filter.Lte(p => p.DueDate, now)
            );

            // Trả về true nếu tồn tại bất kỳ bản ghi nào khớp
            return await _col.Find(filter).AnyAsync();
        }
    }
}
