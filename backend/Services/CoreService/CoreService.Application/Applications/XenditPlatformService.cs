using CoreService.Application.DTOs.ApiResponse;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using CoreService.Repository.Repositories;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public interface IXenditPlatformService
    {
        Task<string> CreateSubAccountAsync(
    string operatorId, string email, string businessName, string operatorPaymentAccountId);
    }

    public class XenditPlatformService : IXenditPlatformService
    {
        private readonly IXenditClient _client;
        private readonly IOperatorPaymentAccountRepo _repo;

        public XenditPlatformService(IXenditClient client, IOperatorPaymentAccountRepo repo)
        { _client = client; _repo = repo; }

        public async Task<string> CreateSubAccountAsync(
    string operatorId, string email, string businessName, string operatorPaymentAccountId)
        {
            // *** Payload: Vẫn dùng "MANAGED" nếu bạn muốn quản lý, hoặc đổi thành "OWNED" tùy yêu cầu ***
            var body = new
            {
                type = "MANAGED", // Giả định dùng MANAGED
                email = email,
                country = "VN",
                public_profile = new
                {
                    business_name = businessName
                },
                business_profile = new
                {
                    business_name = businessName
                }
            };

            // Idempotency key là bắt buộc để tránh tạo trùng khi retry
            var idempotencyKey = $"ops-acc-{operatorId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

            var res = await _client.PostAsync(
                "/v2/accounts",
                body,
                forUserId: null,
                idempotencyKey: idempotencyKey
            );

            var text = await res.Content.ReadAsStringAsync();

            // --- Xử lý lỗi (giữ nguyên logic bóc lỗi chi tiết của bạn) ---
            if (!res.IsSuccessStatusCode)
            {
                // ... (Logic xử lý lỗi chi tiết) ...
                throw new ApiException($"Xendit error {res.StatusCode} {res.ReasonPhrase}: {text}", StatusCodes.Status400BadRequest);
            }

            // 1. Parse Xendit User ID chính xác
            using var doc = System.Text.Json.JsonDocument.Parse(text);
            var root = doc.RootElement;
            var xenditUserId = root.GetProperty("id").GetString();

            if (string.IsNullOrWhiteSpace(xenditUserId))
                throw new ApiException($"Không tìm thấy Xendit account id trong response: {text}", StatusCodes.Status400BadRequest);

            // 2. *** SỬA LỖI LƯU TRỮ: CẬP NHẬT Xendit ID vào DB ***
            var paymentAcc = await _repo.GetByIdAsync(operatorPaymentAccountId)
                                 ?? throw new ApiException("Bản ghi OperatorPaymentAccount không tồn tại.");

            paymentAcc.XenditUserId = xenditUserId;
            // Cập nhật các trường khác như trạng thái (REGISTERED) nếu cần

            await _repo.UpdateAsync(paymentAcc);

            return xenditUserId; // Trả về Xendit ID để sử dụng tiếp
        }
    }

}