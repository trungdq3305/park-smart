using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.PaymentDtos.CoreService.Application.DTOs.PaymentDtos;
using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IPaymentApp
    {
        Task<PaymentRecord> CreatePaymentInvoiceAsync(
    string operatorId, string entityId, string accountId, long amount, PaymentType type);
        //Task<IEnumerable<PaymentRecord>> GetOperatorPaymentsAsync(string operatorId, int take = 50);
        Task<IEnumerable<PaymentRecord>> GetByCreatedByAsync(string accountId);
        //Task<object> GetOperatorBalanceAsync(string operatorId);
        Task<BalanceDto> GetOperatorBalanceAsync(string operatorId);
        Task<TransactionListDto> GetOperatorPaymentsAsync(
            string operatorId,
            DateTime? from = null, DateTime? to = null,
            int limit = 50);

        Task<ApiResponse<RefundRecord>> RefundByPaymentIdAsync(
            string operatorId,
            string paymentId, string accountId,    // Tham số mới: ID của PaymentRecord
            long amount,
            string? reason = null);
        Task<PaymentTotalsDto> GetOperatorTotalsAsync(
    string operatorId, DateTime? from = null, DateTime? to = null);
        Task<PaymentRecord?> GetLatestPaymentByReservationAsync(string reservationId);
        Task<string> GetInvoiceStatusAsync(string operatorId, string invoiceId);
        Task UpdatePaymentStatusAsync(string invoiceId, string newStatus);
        Task<PaymentRecord> GetByIdAsync(string Id);
        Task<IEnumerable<RefundRecord>> GetRefundsByCreatedByAsync(string accountId, int take = 50);
        Task<PaymentRecord> CreateSubscriptionInvoiceAsync(
        string operatorId, string entityId,
        long amount, DateTime dueDate);

        // Method mới để lấy các hóa đơn phí định kỳ theo trạng thái
        Task<IEnumerable<PaymentRecord>> GetSubscriptionInvoicesByStatusAsync(
            string operatorId, IEnumerable<string> statuses);
        Task<string> GetOperatorAccountStatusAsync(string operatorId);
        Task<object> GetXenditInvoiceDetailAsync(string paymentId);
    }
}
