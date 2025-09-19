using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IFaqRepository
    {
        Task<Faq> GetByIdAsync(string id);
        Task<IEnumerable<Faq>> GetAllAsync(); // chỉ trả active (DeletedAt == null)
        Task AddAsync(Faq entity);
        Task UpdateAsync(Faq entity);
        Task SoftDeleteAsync(string id, string byAccountId);
        Task<IEnumerable<Faq>> GetByStatusAsync(string statusId);
        Task<IEnumerable<Faq>> GetByAccountAsync(string accountId);
    }
}
