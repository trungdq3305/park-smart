using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.DTOs;
using Dotnet.Shared.ServiceClients;
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
        private readonly IParkingServiceClient _parkingClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public OperatorApplication(IParkingLotOperatorRepository operatorRepo, IAccountRepository accountRepo, IParkingServiceClient parkingClient, IHttpContextAccessor httpContextAccessor)
        {
            _operatorRepo = operatorRepo;
            _accountRepo = accountRepo;
            _parkingClient = parkingClient;
            _httpContextAccessor = httpContextAccessor;
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
            // 🔹 Check trùng phone number
            if (!string.IsNullOrEmpty(dto.PhoneNumber))
            {
                var existingPhone = await _accountRepo.GetByPhoneNumberAsync(dto.PhoneNumber);
                if (existingPhone != null && existingPhone.Id != account.Id)
                    throw new ApiException("Số điện thoại đã tồn tại", StatusCodes.Status400BadRequest);
            }

            // Update Account
            account.PhoneNumber = dto.PhoneNumber;
            account.UpdatedAt = DateTime.UtcNow;
            account.UpdatedBy = accountId;

            // Update Operator
            operatorEntity.FullName = dto.FullName;
            //operatorEntity.TaxCode = dto.TaxCode;
            operatorEntity.CompanyName = dto.CompanyName;
            operatorEntity.ContactEmail = dto.ContactEmail;
            operatorEntity.UpdatedAt = DateTime.UtcNow;
            operatorEntity.UpdatedBy = accountId;

            var addressDto = new UpdateAddressDto
            {
                WardId = dto.WardId,
                FullAddress = dto.FullAddress
            };
            var auth = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].FirstOrDefault();
            var token = (auth != null && auth.StartsWith("Bearer ")) ? auth.Substring("Bearer ".Length) : null;
            try
            {
                if (operatorEntity.AddressId != null)
                {
                    var updated = await _parkingClient.UpdateAddressAsync(operatorEntity.AddressId, addressDto, token);
                    if (updated == null)
                        throw new ApiException("Không cập nhật được địa chỉ trong ParkingService", StatusCodes.Status502BadGateway);
                }
                else
                {
                    var created = await _parkingClient.CreateAddressAsync(addressDto, token);
                    if (created == null)
                        throw new ApiException("Không tạo được địa chỉ trong ParkingService", StatusCodes.Status502BadGateway);

                    operatorEntity.AddressId = created.Id;
                }
            }
            catch (HttpRequestException ex)
            {
                throw new ApiException($"Lỗi kết nối tới ParkingService: {ex.Message}", StatusCodes.Status502BadGateway);
            }
            catch (Exception ex)
            {
                throw new ApiException($"Lỗi khi gọi ParkingService: {ex.Message}", StatusCodes.Status500InternalServerError);
            }

            await _accountRepo.UpdateAsync(account);
            await _operatorRepo.UpdateAsync(operatorEntity);

            return new ApiResponse<OperatorUpdateDto>(dto, true, "Cập nhật thông tin operator thành công", StatusCodes.Status200OK);
        }
    }

}
