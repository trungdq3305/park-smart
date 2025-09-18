using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface ITermAndPolicyRepository
    {
        Task<TermAndPolicy?> GetByIdAsync(string id);
        Task<IEnumerable<TermAndPolicy>> GetAllAsync();
        Task AddAsync(TermAndPolicy entity);
        Task UpdateAsync(TermAndPolicy entity);
        Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt);
        Task<IEnumerable<TermAndPolicy>> GetByAdminIdAsync(string cityAdminId);
    }
}
