using CoreService.Repository.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CoreService.API.Controllers
{
    [ApiController]
    [Route("api/xendit/webhook")]
    public class XenditWebhookController : ControllerBase
    {
        private readonly IOperatorPaymentAccountRepo _repo;
        // Inject IConfiguration để đọc appsettings.json
        private readonly IConfiguration _config;

        public XenditWebhookController(IOperatorPaymentAccountRepo repo, IConfiguration config)
        {
            _repo = repo;
            _config = config;
        }

        [HttpPost("account")]
        [Consumes("application/json")]
        public async Task<IActionResult> HandleAccountWebhook()
        {
            // --- Lấy Webhook Token từ cấu hình ---
            // Đường dẫn trong appsettings.json là "Xendit:WebhookVerifyToken"
            var xenditWebhookToken = _config["Xendit:WebhookVerifyToken"];

            // Kiểm tra cấu hình token có hợp lệ không
            if (string.IsNullOrWhiteSpace(xenditWebhookToken))
            {
                // Đây là lỗi cấu hình nội bộ, không nên trả về cho Xendit
                return StatusCode(500, new { error = "Internal server error: Xendit Webhook Token is missing in configuration." });
            }

            // --- 1. Xác thực Webhook ---
            if (!Request.Headers.TryGetValue("X-Callback-Token", out var tokenHeader))
            {
                // Xendit yêu cầu phải có token
                return Unauthorized(new { error = "Missing X-Callback-Token" });
            }

            if (tokenHeader.ToString() != xenditWebhookToken)
            {
                // Token không khớp -> Yêu cầu giả mạo
                return Unauthorized(new { error = "Invalid X-Callback-Token" });
            }

            // --- 2. Đọc Payload và Phân tích JSON ---
            // Cho phép đọc body nhiều lần
            Request.EnableBuffering();
            // Đặt lại vị trí đọc về 0
            Request.Body.Position = 0;

            using var reader = new StreamReader(Request.Body);
            var jsonString = await reader.ReadToEndAsync();

            try
            {
                using var doc = JsonDocument.Parse(jsonString);
                var root = doc.RootElement;

                var eventName = root.TryGetProperty("event", out var e) ? e.GetString() : null;
                var data = root.TryGetProperty("data", out var d) ? d : default;

                // Xử lý sự kiện cập nhật tài khoản (Account Updated)
                if (eventName != "account.updated" || data.ValueKind == JsonValueKind.Undefined)
                {
                    // Log: Bỏ qua các event không liên quan. Trả về 200 OK.
                    return Ok(new { message = $"Ignored event: {eventName}" });
                }

                var xenditUserId = data.TryGetProperty("id", out var id) ? id.GetString() : null;
                var newStatus = data.TryGetProperty("status", out var s) ? s.GetString() : null;

                if (string.IsNullOrEmpty(xenditUserId) || string.IsNullOrEmpty(newStatus))
                {
                    return Ok(new { message = "Webhook received but required data is missing." });
                }

                // --- 3. Logic cập nhật Database ---
                // Cập nhật khi trạng thái là REGISTERED hoặc LIVE
                if (newStatus == "REGISTERED" || newStatus == "LIVE")
                {
                    // **GIẢ ĐỊNH:** _repo.GetByXenditIdAsync(id) và _repo.UpdateAsync(acc) đã có sẵn
                    var account = await _repo.GetByXenditUserAsync(xenditUserId);

                    if (account != null)
                    {
                        if (account.Status != "REGISTERED" && account.Status != "LIVE")
                        {
                            // Cập nhật trạng thái
                            account.Status = newStatus;
                            await _repo.UpdateAsync(account);
                            // Log thành công
                        }
                    }
                    else
                    {
                        // Log Cảnh báo: ID không tồn tại
                    }
                }

                // --- 4. Phản hồi Xendit ---
                return Ok(new { message = "Webhook received and processed." });
            }
            catch (Exception ex)
            {
                // Log lỗi (ex)
                return Ok(new { error = $"Internal processing error, request accepted." });
            }
        }
    }
}
