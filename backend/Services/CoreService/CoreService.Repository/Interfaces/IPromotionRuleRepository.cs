using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IPromotionRuleRepository
    {
        Task<PromotionRule> GetByIdAsync(string id);
        Task<IEnumerable<PromotionRule>> GetByPromotionIdAsync(string promotionId);
        Task AddAsync(PromotionRule entity);
        Task DeleteAsync(string id);
    }
}
