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
    public class OperatorApplication : IOperatorApplication
    {
        private readonly IParkingLotOperatorRepository _operatorRepo;
        private readonly IAccountRepository _accountRepo;

        public OperatorApplication(IParkingLotOperatorRepository operatorRepo, IAccountRepository accountRepo)
        {
            _operatorRepo = operatorRepo;
            _accountRepo = accountRepo;
        }

        public async Task<ApiResponse<OperatorUpdateDto>> UpdateAsync(OperatorUpdateDto dto, string accountId)
        {
            var operatorEntity = await _operatorRepo.GetByAccountIdAsync(accountId);
            if (operatorEntity == null)
                throw new ApiException("Operator không tồn tại", StatusCodes.Status404NotFound);

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

            // Update Operator
            operatorEntity.FullName = dto.FullName;
            operatorEntity.TaxCode = dto.TaxCode;
            operatorEntity.CompanyName = dto.CompanyName;
            operatorEntity.ContactEmail = dto.ContactEmail;
            operatorEntity.UpdatedAt = DateTime.UtcNow;
            operatorEntity.UpdatedBy = accountId;

            await _accountRepo.UpdateAsync(account);
            await _operatorRepo.UpdateAsync(operatorEntity);

            return new ApiResponse<OperatorUpdateDto>(dto, true, "Cập nhật thông tin operator thành công", StatusCodes.Status200OK);
        }
    }

}
