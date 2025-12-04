using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static CoreService.Application.Applications.SubscriptionPlanApplication;

namespace CoreService.Application.Interfaces
{
    public interface ISubscriptionPlanApplication
    {
        Task<SubscriptionPlan> GetCurrentDefaultPlanAsync();

        // Cập nhật gói phí mặc định
        Task UpdateDefaultPlanAsync(SubscriptionPlanUpdateDto dto);
    }
}
