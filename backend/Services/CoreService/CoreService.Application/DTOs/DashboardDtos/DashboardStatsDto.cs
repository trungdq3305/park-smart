using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.DashboardDtos
{
    public class DashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalDrivers { get; set; }
        public int TotalOperators { get; set; }
        public int TotalAdmins { get; set; }

        public int TotalBannedUsers { get; set; }
        public int TotalActiveUsers { get; set; }
        public int TotalInactiveUsers { get; set; }

        public int NewRegistrationsLast7Days { get; set; }
        public Dictionary<string, int> RegistrationsByDateLast7Days { get; set; }
    }
}
