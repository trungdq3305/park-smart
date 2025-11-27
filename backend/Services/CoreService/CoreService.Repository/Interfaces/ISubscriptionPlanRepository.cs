using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface ISubscriptionPlanRepository
    {
        // CRUD Cơ bản
        Task<SubscriptionPlan?> GetByIdAsync(string id);
        Task<IEnumerable<SubscriptionPlan>> GetAllAsync();
        Task AddAsync(SubscriptionPlan plan);
        Task UpdateAsync(SubscriptionPlan plan);
        Task DeleteAsync(string id); // Xóa cứng (hard delete) hoặc dùng DeletedAt nếu cần soft delete

        // Phương thức truy vấn nghiệp vụ
        Task<SubscriptionPlan?> GetDefaultActivePlanAsync();

    }
}
