using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class DriverApplication : IDriverApplication
    {
        private readonly IDriverRepository _driverRepo;
        private readonly IAccountRepository _accountRepo;

        public DriverApplication(IDriverRepository driverRepo, IAccountRepository accountRepo)
        {
            _driverRepo = driverRepo;
            _accountRepo = accountRepo;
        }

        public async Task<ApiResponse<DriverUpdateDto>> UpdateAsync(DriverUpdateDto dto, string accountId)
        {
            var driver = await _driverRepo.GetByAccountIdAsync(accountId);
            if (driver == null)
                throw new ApiException("Driver không tồn tại", StatusCodes.Status404NotFound);

            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null)
                throw new ApiException("Tài khoản không tồn tại", StatusCodes.Status404NotFound);

            // 🔹 Check trùng phone number
            if (!string.IsNullOrEmpty(dto.PhoneNumber))
            {
                var existingPhone = await _accountRepo.GetByPhoneNumberAsync(dto.PhoneNumber);
                if (existingPhone != null && existingPhone.Id != account.Id)
                    throw new ApiException("Số điện thoại đã tồn tại", StatusCodes.Status400BadRequest);
            }
            // Update fields
            account.PhoneNumber = dto.PhoneNumber;
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            account.UpdatedBy = accountId;

            driver.FullName = dto.FullName;
            driver.Gender = dto.Gender;
            driver.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            driver.UpdatedBy = accountId;

            await _accountRepo.UpdateAsync(account);
            await _driverRepo.UpdateAsync(driver);

            return new ApiResponse<DriverUpdateDto>(dto, true, "Cập nhật thông tin driver thành công", StatusCodes.Status200OK);
        }
    }
}
