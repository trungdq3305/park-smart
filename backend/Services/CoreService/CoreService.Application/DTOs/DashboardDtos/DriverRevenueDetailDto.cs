using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.DashboardDtos
{
    public class DriverRevenueDetailDto
    {
        public string DriverName { get; set; }
        public string DriverPhoneNumber { get; set; }
        public long Amount { get; set; }
        public string PaymentType { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
