using CoreService.Repository.Models;
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
        Task AddAsync(Driver entity);
        Task UpdateAsync(Driver entity);
        Task DeleteAsync(string id);
    }
}
