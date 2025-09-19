using Dotnet.Shared.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;

namespace Dotnet.Shared.ServiceClients
{
    public class ParkingServiceClient : IParkingServiceClient
    {
        private readonly HttpClient _http;

        public ParkingServiceClient(HttpClient http)
        {
            _http = http;
        }

        public async Task<AddressResponseDto?> UpdateAddressAsync(string id,UpdateAddressDto dto, string token)
        {
            // Gắn JWT nếu cần
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await _http.PatchAsJsonAsync($"/parking/addresses/{id}", dto);
            resp.EnsureSuccessStatusCode();

            var apiResp = await resp.Content.ReadFromJsonAsync<ApiResponseShared<AddressResponseDto>>();
            return apiResp?.Data?.FirstOrDefault();
        }

        public async Task<AddressResponseDto?> CreateAddressAsync(UpdateAddressDto dto, string token)
        {
            // Gắn JWT nếu cần
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await _http.PostAsJsonAsync("/parking/addresses", dto);
            resp.EnsureSuccessStatusCode();

            var apiResp = await resp.Content.ReadFromJsonAsync<ApiResponseShared<AddressResponseDto>>();
            return apiResp?.Data?.FirstOrDefault(); ;
        }
    }
}
