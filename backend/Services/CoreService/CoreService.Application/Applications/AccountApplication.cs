using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class AccountApplication : IAccountApplication
    {
        private readonly IAccountRepository _accountRepo;

        public AccountApplication(IAccountRepository accountRepo)
        {
            _accountRepo = accountRepo;
        }

        public async Task<ApiResponse<IEnumerable<Account>>> GetAllAsync()
        {
            var accounts = await _accountRepo.GetAllAsync();
            return new ApiResponse<IEnumerable<Account>>(accounts, true, "Lấy danh sách account thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<Account>> GetByIdAsync(string id)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
                return new ApiResponse<Account>(null, false, "Account không tồn tại", StatusCodes.Status404NotFound);

            return new ApiResponse<Account>(account, true, "Lấy thông tin account thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<Account>> CreateAsync(Account account)
        {
            account.Id = null; // MongoDB sẽ tự tạo Id
            account.CreatedAt = DateTime.UtcNow;
            account.UpdatedAt = DateTime.UtcNow;
            await _accountRepo.AddAsync(account);

            return new ApiResponse<Account>(account, true, "Tạo account thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<Account>> UpdateAsync(string id, Account update)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
                return new ApiResponse<Account>(null, false, "Account không tồn tại", StatusCodes.Status404NotFound);

            // Update các field cơ bản
            account.Email = update.Email ?? account.Email;
            account.PhoneNumber = update.PhoneNumber ?? account.PhoneNumber;
            account.RoleId = update.RoleId ?? account.RoleId;
            account.IsActive = update.IsActive;
            account.UpdatedAt = DateTime.UtcNow;

            await _accountRepo.UpdateAsync(account);
            return new ApiResponse<Account>(account, true, "Cập nhật account thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<string>> DeleteAsync(string id)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
                return new ApiResponse<string>(null, false, "Account không tồn tại", StatusCodes.Status404NotFound);

            await _accountRepo.DeleteAsync(id);
            return new ApiResponse<string>(null, true, "Xoá account thành công", StatusCodes.Status200OK);
        }
    }
}
