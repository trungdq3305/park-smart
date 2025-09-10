using CoreService.Application.DTOs.AccountDtos;
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
    public class AdminApplication : IAdminApplication
    {
        private readonly ICityAdminRepository _adminRepo;
        private readonly IAccountRepository _accountRepo;

        public AdminApplication(ICityAdminRepository adminRepo, IAccountRepository accountRepo)
        {
            _adminRepo = adminRepo;
            _accountRepo = accountRepo;
        }

        public async Task<ApiResponse<CityAdmin>> UpdateAsync(AdminUpdateDto dto, string accountId)
        {
            var adminEntity = await _adminRepo.GetByAccountIdAsync(accountId);
            if (adminEntity == null)
                throw new ApiException("Admin không tồn tại", StatusCodes.Status404NotFound);

            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null)
                throw new ApiException("Tài khoản không tồn tại", StatusCodes.Status404NotFound);

            // 🔹 Check trùng email
            if (!string.IsNullOrEmpty(dto.Email))
            {
                var existingEmail = await _accountRepo.GetByEmailAsync(dto.Email);
                if (existingEmail != null && existingEmail.Id != account.Id)
                    throw new ApiException("Email đã tồn tại", StatusCodes.Status400BadRequest);
            }

            // 🔹 Check trùng phone number
            if (!string.IsNullOrEmpty(dto.PhoneNumber))
            {
                var existingPhone = await _accountRepo.GetByPhoneNumberAsync(dto.PhoneNumber);
                if (existingPhone != null && existingPhone.Id != account.Id)
                    throw new ApiException("Số điện thoại đã tồn tại", StatusCodes.Status400BadRequest);
            }

            // Update Account
            account.PhoneNumber = dto.PhoneNumber;
            account.Email = dto.Email;
            account.UpdatedAt = DateTime.UtcNow;
            account.UpdatedBy = accountId;

            // Update Admin
            adminEntity.FullName = dto.FullName;
            adminEntity.Department = dto.Department;
            adminEntity.Position = dto.Position;
            adminEntity.UpdatedAt = DateTime.UtcNow;
            adminEntity.UpdatedBy = accountId;

            await _accountRepo.UpdateAsync(account);
            await _adminRepo.UpdateAsync(adminEntity);

            return new ApiResponse<CityAdmin>(adminEntity, true, "Cập nhật thông tin admin thành công", StatusCodes.Status200OK);
        }
    }
}
