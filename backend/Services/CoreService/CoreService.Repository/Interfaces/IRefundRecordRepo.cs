using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IRefundRecordRepo
    {
        Task AddAsync(RefundRecord entity);
        Task UpdateAsync(RefundRecord entity);

        Task<RefundRecord?> GetByRefundIdAsync(string xenditRefundId);
        Task<IEnumerable<RefundRecord>> GetByPaymentAsync(string paymentRecordId);
    }
}
