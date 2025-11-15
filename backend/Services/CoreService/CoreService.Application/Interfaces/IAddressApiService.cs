using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static CoreService.Application.Applications.AddressApiService;

namespace CoreService.Application.Interfaces
{
    public interface IAddressApiService
    {
        // Tạo Địa chỉ, trả về Response chứa ID của Address vừa tạo
        Task<ApiResponse<AddressCreationResponseData>> CreateAddressAsync(FullOperatorCreationRequest.AddressCreationRequest request);

        // Xóa Địa chỉ, dùng cho Rollback
        Task DeleteAddressAsync(string addressId);
    }
}
