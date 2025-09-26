using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IPointMilestoneRepository
    {
        Task<PointMilestone?> GetByIdAsync(string id);
        Task<IEnumerable<PointMilestone>> GetAllAsync();
        Task<IEnumerable<PointMilestone>> GetAllCreditAsync();
        Task<IEnumerable<PointMilestone>> GetAllAccumulatedAsync();

        Task AddAsync(PointMilestone entity);
        Task UpdateAsync(PointMilestone entity);
        Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt);
    }
}
