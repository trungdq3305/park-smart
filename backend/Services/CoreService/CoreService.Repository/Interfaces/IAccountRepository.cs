using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IAccountRepository
    {
        Task<Account?> GetByIdAsync(string id);
        Task<Account?> GetByEmailAsync(string email);
        Task<IEnumerable<Account>> GetAllAsync();
        Task AddAsync(Account user);
        Task UpdateAsync(Account user);
        Task DeleteAsync(string id);
    }
}
