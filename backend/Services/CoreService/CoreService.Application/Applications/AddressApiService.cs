using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    // File: AddressApiService.cs
    public class AddressApiService : IAddressApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUri = "http://parksmarthcmc.io.vn:5000";

        // Khai báo tùy chọn Serialization/Deserialization
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            // Thiết lập này RẤT QUAN TRỌNG để khớp tên thuộc tính JSON với tên thuộc tính API đích
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true // Giúp Deserialization linh hoạt hơn
        };

        public AddressApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // Class giúp deserialize phản hồi của API tạo Address
        // Chú ý: API trả về { "data": [ { "_id": "..." } ] } => cần xử lý mảng
        public class AddressCreationResponseData
        {
            // Tên thuộc tính trong JSON phản hồi thực tế là "_id"
            // Nếu bạn không dùng [JsonPropertyName], bạn cần đảm bảo tên thuộc tính C# khớp (ví dụ: public string _id { get; set; })
            // Nhưng tốt nhất là ánh xạ nó về "Id" để dễ dùng trong code C#
            // Nếu API trả về "data" là mảng, cần tạo DTO phù hợp. 
            public string _id { get; set; } // Giữ tên này để khớp với phản hồi API

            // Thêm các thuộc tính khác...
        }

        // Phương thức tạo Address (POST /addresses)
        public async Task<ApiResponse<AddressCreationResponseData>> CreateAddressAsync(FullOperatorCreationRequest.AddressCreationRequest request)
        {
            var url = $"{_baseUri}/addresses";

            // 1. Serialization (Gửi đi) với camelCase
            var jsonContent = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions), // SỬ DỤNG OPTIONS
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(url, jsonContent);

            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                // 2. Deserialization (Nhận về)
                var result = JsonSerializer.Deserialize<ApiResponse<AddressCreationResponseData[]>>(content, _jsonOptions);

                // API trả về mảng trong trường 'data', ta cần lấy phần tử đầu tiên
                if (result.Data == null || result.Data.Length == 0)
                {
                    throw new ApiException("Tạo địa chỉ thành công nhưng không nhận được ID.", (int)response.StatusCode);
                }

                // Cần ánh xạ _id sang Id. Vì API trả về _id, ta dùng _id trong DTO
                // Lưu ý: Nếu API trả về mảng, bạn phải dùng AddressCreationResponseData[]
                // Tuy nhiên, hàm của bạn yêu cầu ApiResponse<AddressCreationResponse>, nên ta cần sửa DTO

                // ********* PHẦN SỬA DTO *********
                // Do API trả về { "data": [ { "_id": "..." } ] }, DTO của bạn cần xử lý mảng
                // Để khớp với hàm dịch vụ gốc:
                // Ta cần tạo một DTO tạm để nắm bắt mảng

                var dataItem = result.Data.First();

                // Chuyển kết quả thành cấu trúc mong muốn của Service
                var finalResult = new ApiResponse<AddressCreationResponseData>
                {
                    Success = result.Success,
                    Message = result.Message,
                    StatusCode = result.StatusCode,
                    Data = dataItem
                };

                return finalResult;
            }

            // Ném ngoại lệ để Rollback nếu gọi API thất bại
            // Sử dụng content (chứa lỗi validation)
            throw new ApiException($"Lỗi API tạo địa chỉ: {content}", (int)response.StatusCode);
        }

        // Phương thức xóa Address (DELETE /addresses/{id}) - Dùng cho Rollback
        public async Task DeleteAddressAsync(string addressId)
        {
            var url = $"{_baseUri}/addresses/{addressId}";
            var response = await _httpClient.DeleteAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Không thể Rollback xóa Address {addressId}. Lỗi: {errorContent}");
            }
        }

        // Đổi tên class này để tránh nhầm lẫn với DTO cha
    }
}
