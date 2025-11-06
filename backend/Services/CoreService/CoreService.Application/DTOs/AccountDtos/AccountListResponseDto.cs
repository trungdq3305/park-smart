using CoreService.Common.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public class AccountListResponseDto
    {
        public int TotalUsers { get; set; }
        public int TotalDrivers { get; set; }
        public int TotalOperators { get; set; }
        public int TotalAdmins { get; set; }
        public PaginationDto<AccountDetailDto> PagedAccounts { get; set; }

    }
}
