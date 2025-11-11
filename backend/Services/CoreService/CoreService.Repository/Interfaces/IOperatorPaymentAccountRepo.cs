using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IOperatorPaymentAccountRepo
    {
        Task<OperatorPaymentAccount?> GetByOperatorAsync(string operatorId);
        Task<OperatorPaymentAccount?> GetByIdAsync(string Id);
        Task<OperatorPaymentAccount?> GetByXenditUserAsync(string xenditUserId);
        Task AddAsync(OperatorPaymentAccount entity);
        Task UpdateAsync(OperatorPaymentAccount entity);
    }
}
