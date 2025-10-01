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
            string operatorId, string reservationId, long amount,
            string successUrl, string failureUrl);

        Task<IEnumerable<PaymentRecord>> GetOperatorPaymentsAsync(string operatorId, int take = 50);

        Task<object> GetOperatorBalanceAsync(string operatorId);

        Task<RefundRecord> RefundAsync(string operatorId, string xenditInvoiceId, long amount);
    }
}
