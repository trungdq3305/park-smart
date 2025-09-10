using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public record AccountDetailDto
    {
        // Thông tin cơ bản từ Account
        public string Id { get; set; }
        public string RoleId { get; set; }
        public string RoleName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DriverDto DriverDetail { get; set; }
        public OperatorDto OperatorDetail { get; set; }
        public AdminDto AdminDetail { get; set; }
    }
}

