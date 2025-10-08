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
        Task<PaymentRecord> CreateReservationInvoiceAsync(
            string operatorId, string reservationId, long amount);

        //Task<IEnumerable<PaymentRecord>> GetOperatorPaymentsAsync(string operatorId, int take = 50);

        //Task<object> GetOperatorBalanceAsync(string operatorId);
        Task<BalanceDto> GetOperatorBalanceAsync(string operatorId);
        Task<TransactionListDto> GetOperatorPaymentsAsync(
            string operatorId,
            DateTime? from = null, DateTime? to = null,
            int limit = 50);
        Task<ApiResponse<RefundRecord>> RefundAsync(
    string operatorId,
    string reservationId,   // ƯU TIÊN refund theo reservation
    long amount,
    string? reason = null);

        Task<RefundRecord> RefundByInvoiceAsync(string operatorId, string invoiceId, long amount, string? reason = null);
        Task<PaymentTotalsDto> GetOperatorTotalsAsync(
    string operatorId, DateTime? from = null, DateTime? to = null);
        Task<PaymentRecord?> GetLatestPaymentByReservationAsync(string reservationId);
        Task<string> GetInvoiceStatusAsync(string operatorId, string invoiceId);
        Task UpdatePaymentStatusAsync(string invoiceId, string newStatus);
    }
}
