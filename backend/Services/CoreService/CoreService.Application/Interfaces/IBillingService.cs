using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IBillingService
    {
        Task RunMonthlyBillingAndSuspensionJobAsync();
    }
}
