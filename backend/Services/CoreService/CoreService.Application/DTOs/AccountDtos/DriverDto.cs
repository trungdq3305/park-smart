using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public class DriverDto
    {
        public string Id { get; set; }
        public string AccountId { get; set; }
        public string FullName { get; set; }
        public bool Gender { get; set; }
        public string DrivingLicenseNumber { get; set; }
        public bool IsVerified { get; set; }
        public int CreditPoint { get; set; }
        public decimal AccumulatedPoints { get; set; }
    }
}
