using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.DTOs.ParkingLotDtos;
using CoreService.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using static CoreService.Application.Applications.AuthApplication;

namespace CoreService.Application.Applications
{
    // File: ParkingLotApiService.cs
    public class ParkingLotApiService : IParkingLotApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUri = "http://parksmarthcmc.io.vn:5000"; // Base URL của API
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        public ParkingLotApiService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // Phương thức tạo Parking Lot (POST /parking-lots/create-parking-lot-request)
        public async Task<ApiResponse<ParkingLotRequestCreationResponse>> CreateParkingLotAsync(
        FullOperatorCreationRequest.ParkingLotCreationRequest request)
        {
            var url = $"{_baseUri}/parking-lots/create-parking-lot-request";

            // Giả lập logic gọi API POST
            var jsonContent = new StringContent(
            System.Text.Json.JsonSerializer.Serialize(request, _jsonOptions), // <--- SỬ DỤNG _jsonOptions
            System.Text.Encoding.UTF8,
            "application/json"
        );

            var response = await _httpClient.PostAsync(url, jsonContent);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();

                // 1. Sửa kiểu Deserialization: Tùy biến kiểu data thành MẢNG
                var arrayResult = System.Text.Json.JsonSerializer.Deserialize<ApiResponse<ParkingLotRequestCreationResponse[]>>(content, _jsonOptions);

                if (arrayResult.Data == null || arrayResult.Data.Length == 0)
                {
                    throw new ApiException("Tạo yêu cầu bãi đỗ xe thành công nhưng không nhận được dữ liệu phản hồi.", (int)response.StatusCode);
                }

                // 2. Lấy phần tử đầu tiên từ mảng
                var dataItem = arrayResult.Data.First();

                // 3. Tự tạo ApiResponse cuối cùng (Sử dụng constructor hoặc Object Initializer nếu bạn đã thêm constructor mặc định)
                // Giả sử ApiResponse có constructor 4 tham số:
                return new ApiResponse<ParkingLotRequestCreationResponse>(
                    data: dataItem,
                    success: arrayResult.Success,
                    message: arrayResult.Message,
                    statusCode: arrayResult.StatusCode
                );

            }

            // Ném ngoại lệ để kích hoạt Rollback
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new ApiException($"Lỗi API tạo bãi đỗ xe: {errorContent}", (int)response.StatusCode);
        }
        public async Task DeleteParkingLotRequestAsync(string requestId)
        {
            var url = $"{_baseUri}/parking-lots/core/requests/{requestId}"; // Endpoint mới

            var response = await _httpClient.DeleteAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                // Ném exception để logic Rollback bên ngoài có thể ghi log
                throw new Exception($"Không thể Rollback xóa Parking Lot Request {requestId}. Lỗi: {errorContent}");
            }
        }
        public async Task<ApiResponse<List<ParkingLotResponse>>> FindParkingLotsByOperatorIdAsync(string operatorId)
        {
            // Xây dựng URL theo định dạng đã cho
            var url = $"{_baseUri}/parking-lots/find-by-operatorId?operatorId={operatorId}";

            try
            {
                // 1. Gửi yêu cầu HTTP
                var response = await _httpClient.GetAsync(url);

                // Đọc nội dung phản hồi
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    // 2. Phân tích cú pháp phản hồi thành đối tượng ApiResponse
                    // Phản hồi trả về một đối tượng ApiResponse, với trường 'data' là MẢNG
                    // của các đối tượng bãi đỗ xe (ParkingLotResponse).
                    var apiResponse = System.Text.Json.JsonSerializer.Deserialize<ApiResponse<List<ParkingLotResponse>>>(content, _jsonOptions);

                    if (apiResponse == null)
                    {
                        // Xử lý trường hợp deserialize thành công nhưng đối tượng là null
                        throw new ApiException("Phản hồi API không hợp lệ hoặc rỗng sau khi deserialize.", (int)response.StatusCode);
                    }

                    // Trả về kết quả thành công
                    return apiResponse;
                }
                else
                {
                    // 3. Xử lý lỗi API (Status Code không thành công: 4xx, 5xx)
                    // Ném ngoại lệ để kích hoạt Rollback/Xử lý lỗi bên ngoài
                    // Dùng nội dung phản hồi (content) để cung cấp thông tin chi tiết về lỗi
                    throw new ApiException($"Lỗi API tìm bãi đỗ xe (Code: {(int)response.StatusCode}): {content}", (int)response.StatusCode);
                }
            }
            catch (ApiException ex)
            {
                // Bắt lại ngoại lệ ApiException đã được ném ra ở trên
                // Bạn có thể ghi log lỗi ở đây nếu cần, sau đó ném lại (re-throw) để xử lý ở tầng cao hơn
                throw;
            }
            catch (System.Text.Json.JsonException ex)
            {
                // Bắt lỗi khi deserialize JSON
                // Ghi log chi tiết về lỗi deserialize và JSON không hợp lệ
                throw new Exception($"Lỗi phân tích cú pháp JSON khi tìm bãi đỗ xe. Chi tiết: {ex.Message}", ex);
            }
            catch (HttpRequestException ex)
            {
                // Bắt lỗi cấp độ mạng/HTTP (ví dụ: không thể kết nối, timeout)
                // Ghi log chi tiết về lỗi HTTP
                throw new Exception($"Lỗi kết nối HTTP khi tìm bãi đỗ xe. URL: {url}. Chi tiết: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                // Bắt các ngoại lệ tổng quát khác
                // Ghi log lỗi chung
                throw new Exception($"Lỗi không xác định khi tìm bãi đỗ xe. Chi tiết: {ex.Message}", ex);
            }
        }
    }
}
