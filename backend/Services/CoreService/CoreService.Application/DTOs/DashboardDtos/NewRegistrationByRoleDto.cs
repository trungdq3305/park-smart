using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.DashboardDtos
{
    public class NewRegistrationByRoleDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalNewAccounts { get; set; }
        public Dictionary<string, int> CountsByRole { get; set; }
    }
}
