using CoreService.Application.DTOs.ApiResponse;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
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
            var body = new
            {
                email,
                business_profile = new { business_name = businessName },
                type = "MANAGED"
            };

            var res = await _client.PostAsync("/v2/accounts", body,
                idempotencyKey: operatorId);

            var text = await res.Content.ReadAsStringAsync();

            if (res.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                throw new ApiException($"Xendit 401 Unauthorized – kiểm tra SecretKey test/prod, IP Allowlist, hoặc ký tự thừa. Body: {text}");

            if (res.StatusCode == System.Net.HttpStatusCode.Forbidden)
                throw new ApiException($"Xendit 403 Forbidden – thường do IP Allowlist. Body: {text}");
            if (!res.IsSuccessStatusCode)
            {
                // log đầy đủ để thấy error_code, message, invalid_fields...
                throw new ApiException($"Xendit error {res.StatusCode} {res.ReasonPhrase}: {text}");
            }
            res.EnsureSuccessStatusCode();

            using var doc = System.Text.Json.JsonDocument.Parse(text);

            string accountId = doc.RootElement.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
            string status = doc.RootElement.TryGetProperty("status", out var s) ? s.GetString() : null;

            if (string.IsNullOrEmpty(accountId))
                throw new ApiException($"Không tìm thấy account id trong response: {text}");

            var e = new OperatorPaymentAccount
            {
                OperatorId = operatorId,
                XenditUserId = accountId!, // trước đây bạn gọi là user_id, thực tế là id
                Status = status!,
                CreatedAt = DateTime.UtcNow
            };
            await _repo.AddAsync(e);
            return e;
        }

    }

}
