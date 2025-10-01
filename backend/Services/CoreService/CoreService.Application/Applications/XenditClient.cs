using CoreService.Common.PaymentHelper;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{

    public interface IXenditClient
    {
        Task<HttpResponseMessage> PostAsync(
            string path, object body, string? forUserId = null, string? idempotencyKey = null);

        Task<HttpResponseMessage> GetAsync(
            string path, string? forUserId = null);
    }

    public class XenditClient : IXenditClient
    {
        private readonly HttpClient _http;
        private readonly XenditOptions _opt;

        public XenditClient(HttpClient http, IOptions<XenditOptions> opt)
        {
            _http = http;
            _opt = opt.Value;

            // Phòng trường hợp BaseAddress chưa có dấu "/"
            if (_http.BaseAddress is null)
                _http.BaseAddress = new Uri(
                    _opt.ApiBaseUrl.EndsWith("/") ? _opt.ApiBaseUrl : _opt.ApiBaseUrl + "/");

            // Đảm bảo Authorization đúng chuẩn Basic <base64(secretKey:)>
            var token = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_opt.SecretKey}:"));
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
            if (!_http.DefaultRequestHeaders.Accept.Any())
                _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        public Task<HttpResponseMessage> GetAsync(string path, string? forUserId = null)
        {
            var req = new HttpRequestMessage(HttpMethod.Get, Trim(path));
            if (!string.IsNullOrWhiteSpace(forUserId))
                req.Headers.Add("for-user-id", forUserId);

            return _http.SendAsync(req);
        }

        public Task<HttpResponseMessage> PostAsync(
            string path, object body, string? forUserId = null, string? idempotencyKey = null)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, Trim(path));
            var json = JsonSerializer.Serialize(body);
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");

            if (!string.IsNullOrWhiteSpace(forUserId))
                req.Headers.Add("for-user-id", forUserId);

            // chống tạo trùng
            req.Headers.TryAddWithoutValidation("x-idempotency-key",
                idempotencyKey ?? $"ps-{Guid.NewGuid()}");

            return _http.SendAsync(req);
        }

        private static string Trim(string p) => p.StartsWith("/") ? p[1..] : p;
    }
}
