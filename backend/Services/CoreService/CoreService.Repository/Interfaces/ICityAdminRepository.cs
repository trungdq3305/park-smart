using CoreService.Repository.Models;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface ICityAdminRepository
    {
        Task<CityAdmin?> GetByIdAsync(string id);
        Task<IEnumerable<CityAdmin>> GetAllAsync();
        Task AddAsync(CityAdmin entity, IClientSessionHandle session = null);
        Task UpdateAsync(CityAdmin entity, IClientSessionHandle session = null);
        Task DeleteAsync(string id, IClientSessionHandle session = null);
        Task<CityAdmin?> GetByAccountIdAsync(string accountId);
    }
}
