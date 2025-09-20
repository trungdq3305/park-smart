using Dotnet.Shared.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dotnet.Shared.ServiceClients
{
    public interface IParkingServiceClient
    {
        Task<AddressResponseDto?> UpdateAddressAsync(string id, UpdateAddressDto dto, string token);
        Task<AddressResponseDto?> CreateAddressAsync(UpdateAddressDto dto, string token);
    }

}
