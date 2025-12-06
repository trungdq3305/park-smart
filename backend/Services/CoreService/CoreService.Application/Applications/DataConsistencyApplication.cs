using CoreService.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    // CoreService.Application.Applications/DataConsistencyApplication.cs (Tạo mới)

    public class DataConsistencyApplication
    {
        private readonly IAccountRepository _accountRepo;
        private readonly IDriverRepository _driverRepo;
        private readonly IParkingLotOperatorRepository _opRepo;
        private readonly ICityAdminRepository _adminRepo;

        // Khởi tạo Dependency Injection
        public DataConsistencyApplication(IAccountRepository accountRepo, IDriverRepository driverRepo, IParkingLotOperatorRepository opRepo, ICityAdminRepository adminRepo)
        {
            _accountRepo = accountRepo;
            _driverRepo = driverRepo;
            _opRepo = opRepo;
            _adminRepo = adminRepo;
        }

        /// <summary>
        /// Kiểm tra và xóa các bản ghi Role bị mồ côi (Role có nhưng Account không có).
        /// </summary>
        public async Task CleanUpOrphanedRolesAsync()
        {
            // Xử lý Driver
            var allDrivers = await _driverRepo.GetAllAsync();
            foreach (var driver in allDrivers)
            {
                var account = await _accountRepo.GetByIdAsync(driver.AccountId);
                if (account == null)
                {
                    // Console.WriteLine($"[CLEANUP] Xóa Driver {driver.Id} vì Account {driver.AccountId} không tồn tại.");
                    await _driverRepo.DeleteAsync(driver.Id);
                }
            }

            // Xử lý Operator
            var allOperators = await _opRepo.GetAllAsync();
            foreach (var op in allOperators)
            {
                var account = await _accountRepo.GetByIdAsync(op.AccountId);
                if (account == null)
                {
                    // Console.WriteLine($"[CLEANUP] Xóa Operator {op.Id} vì Account {op.AccountId} không tồn tại.");
                    await _opRepo.DeleteAsync(op.Id);
                }
            }

            // Xử lý Admin
            var allAdmins = await _adminRepo.GetAllAsync();
            foreach (var admin in allAdmins)
            {
                var account = await _accountRepo.GetByIdAsync(admin.AccountId);
                if (account == null)
                {
                    // Console.WriteLine($"[CLEANUP] Xóa Admin {admin.Id} vì Account {admin.AccountId} không tồn tại.");
                    await _adminRepo.DeleteAsync(admin.Id);
                }
            }
        }

        /// <summary>
        /// Kiểm tra và xóa các bản ghi Account bị mồ côi (Account có nhưng không có Role tương ứng).
        /// </summary>
        public async Task CleanUpOrphanedAccountsAsync()
        {
            var allAccounts = await _accountRepo.GetAllAsync();

            foreach (var account in allAccounts)
            {
                if (account.IsActive == false && account.DeletedAt != null) continue; // Bỏ qua tài khoản đã bị xóa/chưa kích hoạt

                bool roleExists = true;

                // Vai trò Admin: "68bee1c000a9410adb97d39f"
                if (account.RoleId == "68bee1c000a9410adb97d39f")
                {
                    roleExists = await _adminRepo.GetByAccountIdAsync(account.Id) != null;
                }
                // Vai trò Operator: "68bee1f500a9410adb97d3a0"
                else if (account.RoleId == "68bee1f500a9410adb97d3a0")
                {
                    roleExists = await _opRepo.GetByAccountIdAsync(account.Id) != null;
                }
                // Vai trò Driver: "68bee20c00a9410adb97d3a1"
                else if (account.RoleId == "68bee20c00a9410adb97d3a1")
                {
                    roleExists = await _driverRepo.GetByAccountIdAsync(account.Id) != null;
                }

                if (!roleExists)
                {
                    // Console.WriteLine($"[CLEANUP] Xóa Account {account.Id} (Role {account.RoleId}) vì không có Role tương ứng.");
                    await _accountRepo.DeleteAsync(account.Id);
                }
            }
        }
    }
}
