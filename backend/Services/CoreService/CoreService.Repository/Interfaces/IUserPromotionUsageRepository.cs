using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IUserPromotionUsageRepository
    {
        Task<int> CountUserUsageAsync(string userId, string promotionId);
        Task AddAsync(UserPromotionUsage entity);
        Task<UserPromotionUsage> GetByEntityIdAsync(string entityId);
        Task UpdateAsync(UserPromotionUsage entity);
    }

}
