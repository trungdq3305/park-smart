using CoreService.Application.DTOs.ApiResponse;
using CoreService.Common.Helpers;
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
    public interface IXenditPlatformService
    {
        Task<OperatorPaymentAccount> CreateSubAccountAsync(string operatorId, string email, string businessName);
    }

    public class XenditPlatformService : IXenditPlatformService
    {
        private readonly IXenditClient _client;
        private readonly IOperatorPaymentAccountRepo _repo;

        public XenditPlatformService(IXenditClient client, IOperatorPaymentAccountRepo repo)
        { _client = client; _repo = repo; }

        public async Task<OperatorPaymentAccount> CreateSubAccountAsync(
    string operatorId, string email, string businessName)
        {
            // payload TỐI THIỂU hợp lệ cho OWNED
            var body = new
            {
                type = "OWNED",
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

            // Nên dùng idempotency key duy nhất mỗi lần gọi (tránh 409 khi retry)
            var res = await _client.PostAsync(
                "/v2/accounts",
                body,
                forUserId: null,
                idempotencyKey: $"ops-{operatorId}-{Guid.NewGuid()}"
            );

            var text = await res.Content.ReadAsStringAsync();

            if (res.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                throw new ApiException(
                    $"Xendit 401 Unauthorized – kiểm tra SecretKey test/prod, IP Allowlist. Body: {text}",
                    StatusCodes.Status401Unauthorized);

            if (res.StatusCode == System.Net.HttpStatusCode.Forbidden)
                throw new ApiException(
                    $"Xendit 403 Forbidden – thường do IP Allowlist. Body: {text}",
                    StatusCodes.Status403Forbidden);

            if (!res.IsSuccessStatusCode)
            {
                // Cố gắng bóc tách lỗi chi tiết để log/hiển thị
                try
                {
                    using var err = System.Text.Json.JsonDocument.Parse(text);
                    var errCode = err.RootElement.TryGetProperty("error_code", out var ec) ? ec.GetString() : null;
                    var msg = err.RootElement.TryGetProperty("message", out var em) ? em.GetString() : text;
                    throw new ApiException(
                        $"Xendit error {res.StatusCode} ({errCode}): {msg}. Raw: {text}",
                        StatusCodes.Status400BadRequest);
                }
                catch
                {
                    throw new ApiException(
                        $"Xendit error {res.StatusCode} {res.ReasonPhrase}: {text}",
                        StatusCodes.Status400BadRequest);
                }
            }

            // Parse response đúng field: Xendit trả về "id" (không phải "user_id")
            using var doc = System.Text.Json.JsonDocument.Parse(text);
            var root = doc.RootElement;

            var accountId = root.GetProperty("id").GetString();      // ví dụ "68dd0a2e..."
            var status = root.TryGetProperty("status", out var s) ? s.GetString() : "UNKNOWN";

            if (string.IsNullOrWhiteSpace(accountId))
                throw new ApiException($"Không tìm thấy account id trong response: {text}", StatusCodes.Status400BadRequest);

            var e = new OperatorPaymentAccount
            {
                OperatorId = operatorId,
                XenditUserId = accountId,     // dùng "id" làm for-user-id cho các call sau
                Status = status,
                CreatedAt = DateTime.UtcNow
            };

            await _repo.AddAsync(e);
            return e;
        }


    }

}
