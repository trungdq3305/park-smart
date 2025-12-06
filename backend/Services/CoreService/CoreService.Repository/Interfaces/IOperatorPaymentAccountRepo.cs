using CoreService.Repository.Models;
using MongoDB.Driver;
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
        Task AddAsync(OperatorPaymentAccount entity, IClientSessionHandle session = null);
        Task UpdateAsync(OperatorPaymentAccount entity, IClientSessionHandle session = null);
        Task DeleteAsync(string id);
    }
}
