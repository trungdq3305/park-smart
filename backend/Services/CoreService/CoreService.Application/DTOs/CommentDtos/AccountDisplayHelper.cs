using CoreService.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.CommentDtos
{
    public class AccountDisplayHelper
    {
        private readonly IDriverRepository _driverRepo;
        private readonly IParkingLotOperatorRepository _operatorRepo;
        private readonly ICityAdminRepository _adminRepo;

        public AccountDisplayHelper(
            IDriverRepository driverRepo,
            IParkingLotOperatorRepository operatorRepo,
            ICityAdminRepository adminRepo)
        {
            _driverRepo = driverRepo;
            _operatorRepo = operatorRepo;
            _adminRepo = adminRepo;
        }

        public async Task<(string name, string role)> ResolveAsync(string accountId)
        {
            var d = await _driverRepo.GetByAccountIdAsync(accountId);
            if (d != null) return (d.FullName ?? "Driver", "Driver");

            var o = await _operatorRepo.GetByAccountIdAsync(accountId);
            if (o != null) return (o.FullName ?? "Operator", "Operator");

            var a = await _adminRepo.GetByAccountIdAsync(accountId);
            if (a != null) return (a.FullName ?? "Admin", "Admin");

            return ("Unknown", "Unknown");
        }
    }
}
