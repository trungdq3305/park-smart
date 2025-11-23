using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IPromotionRepository
    {
        Task<Promotion> GetByIdAsync(string id);
        Task<Promotion> GetByCodeAsync(string code);
        Task<IEnumerable<Promotion>> GetAllAsync();
        Task<IEnumerable<Promotion>> GetByOperatorIdAsync(string operatorId);
        Task AddAsync(Promotion entity);
        Task UpdateAsync(Promotion entity);
        Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt);
    }
}
