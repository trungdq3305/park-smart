using CoreService.Repository.Models;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IDriverRepository
    {
        Task<Driver?> GetByIdAsync(string id);
        Task<IEnumerable<Driver>> GetAllAsync();
        Task AddAsync(Driver entity, IClientSessionHandle session = null);
        Task UpdateAsync(Driver entity, IClientSessionHandle session = null);
        Task DeleteAsync(string id, IClientSessionHandle session = null);
        Task<Driver?> GetByAccountIdAsync(string accountId);
        Task<bool> UpdateCreditPointByAccountIdAsync(string accountId, int newCreditPoint);
    }
}
