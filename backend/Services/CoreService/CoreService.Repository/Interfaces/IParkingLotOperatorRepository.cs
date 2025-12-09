using CoreService.Repository.Models;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IParkingLotOperatorRepository
    {
        Task<ParkingLotOperator?> GetByIdAsync(string id);
        Task<IEnumerable<ParkingLotOperator>> GetAllAsync();
        Task AddAsync(ParkingLotOperator entity, IClientSessionHandle session = null);
        Task UpdateAsync(ParkingLotOperator entity, IClientSessionHandle session = null);
        Task DeleteAsync(string id, IClientSessionHandle session = null);
        Task<ParkingLotOperator?> GetByAccountIdAsync(string accountId);
        Task<ParkingLotOperator?> GetByPaymentEmailAsync(string PaymentEmail);
    }
}
