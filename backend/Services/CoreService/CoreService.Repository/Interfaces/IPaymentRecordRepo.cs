using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IPaymentRecordRepo
    {
        Task AddAsync(PaymentRecord entity);
        Task UpdateAsync(PaymentRecord entity);

        Task<PaymentRecord?> GetByIdAsync(string id);
        Task<PaymentRecord?> GetByInvoiceIdAsync(string xenditInvoiceId);
        Task<PaymentRecord?> GetByExternalIdAsync(string externalId);

        Task<IEnumerable<PaymentRecord>> GetByOperatorAsync(string operatorId, int take = 50);
        Task<IEnumerable<PaymentRecord>> GetByReservationAsync(string reservationId);

        Task<PaymentRecord?> GetLatestByReservationIdAsync(string reservationId);

        // (tuỳ chọn) lấy theo operator + reservation
        Task<PaymentRecord?> GetLatestByReservationAsync(string operatorId, string reservationId);
        Task<IEnumerable<PaymentRecord>> GetByCreatedByAsync(string accountId, int take = 50);
        Task<IEnumerable<PaymentRecord>> GetByTypeAndStatusAsync(
        string operatorId,
        PaymentType type,
        IEnumerable<string> statuses);
        Task<IEnumerable<PaymentRecord>> GetByCreatedByAndStatusAsync(
        string accountId,
        string status,
        int take = 50);
        Task<IEnumerable<PaymentRecord>> GetFilteredPaymentsAsync(
        string? operatorId, // Có thể null (Admin) hoặc có giá trị (Operator)
        IEnumerable<PaymentType>? paymentTypes, // Lọc theo loại thanh toán
        string? status, // Lọc theo trạng thái
        DateTime? fromDate, // Ngày bắt đầu
        DateTime? toDate
    );
        Task<long> CountFilteredPaymentsAsync(
            string? operatorId,
            IEnumerable<PaymentType>? paymentTypes,
            string? status,
            DateTime? fromDate,
            DateTime? toDate
        );
    }
}
