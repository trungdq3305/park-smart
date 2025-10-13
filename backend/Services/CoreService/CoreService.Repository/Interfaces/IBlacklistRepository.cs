using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IBlacklistRepository
    {
        Task<Blacklist> GetByIdAsync(string id);
        Task<IEnumerable<Blacklist>> GetAllAsync();
        Task<IEnumerable<Blacklist>> GetByOperatorIdAsync(string operatorId);
        Task<Blacklist> FindByOperatorAndDriverAsync(string operatorId, string driverId);
        Task AddAsync(Blacklist entity);
        Task UpdateAsync(Blacklist entity);
        Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt);
    }
}
