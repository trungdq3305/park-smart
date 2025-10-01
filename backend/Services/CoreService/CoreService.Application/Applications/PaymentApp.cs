using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class PaymentApp : IPaymentApp
    {
        private readonly IXenditClient _x;
        private readonly IOperatorPaymentAccountRepo _accRepo;
        private readonly IPaymentRecordRepo _payRepo;
        private readonly IRefundRecordRepo _refundRepo;

        public PaymentApp(IXenditClient x,
            IOperatorPaymentAccountRepo accRepo,
            IPaymentRecordRepo payRepo,
            IRefundRecordRepo refundRepo)
        { _x = x; _accRepo = accRepo; _payRepo = payRepo; _refundRepo = refundRepo; }

        public async Task<PaymentRecord> CreateReservationInvoiceAsync(
    string operatorId, string reservationId, long amount,
    string successUrl, string failureUrl)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                        ?? throw new ApiException("Operator chưa có tài khoản thanh toán");

            // 1) Kiểm tra trạng thái sub-account
            var check = await _x.GetAsync($"/v2/accounts/{acc.XenditUserId}");
            var checkBody = await check.Content.ReadAsStringAsync();
            if (!check.IsSuccessStatusCode)
                throw new ApiException($"Không kiểm tra được tài khoản Xendit: {check.StatusCode} {checkBody}");

            using (var d = JsonDocument.Parse(checkBody))
            {
                var st = d.RootElement.GetProperty("status").GetString();
                if (!string.Equals(st, "REGISTERED", StringComparison.OrdinalIgnoreCase))
                    throw new ApiException($"Tài khoản thanh toán của operator chưa ACTIVE (hiện: {st}). Hãy mở email mời và Accept.");
            }

            // 2) Tạo invoice
            var externalId = $"RES-{reservationId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            var body = new
            {
                external_id = externalId,
                amount = amount,
                currency = "VND",
                description = $"Reservation #{reservationId}",
                success_redirect_url = successUrl,
                failure_redirect_url = failureUrl,
                should_send_email = false
            };

            var res = await _x.PostAsync("/v2/invoices", body, forUserId: acc.XenditUserId);
            var json = await res.Content.ReadAsStringAsync();

            // Log lỗi rõ ràng nếu 4xx/5xx
            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit tạo invoice lỗi: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {json}");

            using var doc = JsonDocument.Parse(json);
            var invoiceId = doc.RootElement.GetProperty("id").GetString();
            var status = doc.RootElement.GetProperty("status").GetString();
            var url = doc.RootElement.GetProperty("invoice_url").GetString();

            var pr = new PaymentRecord
            {
                ReservationId = reservationId,
                OperatorId = operatorId,
                XenditInvoiceId = invoiceId,
                ExternalId = externalId,
                Amount = amount,
                Status = status,
                XenditUserId = acc.XenditUserId, // hoặc đổi tên field trong model
                CheckoutUrl = url
            };
            await _payRepo.AddAsync(pr);
            return pr;
        }


        public async Task<IEnumerable<PaymentRecord>> GetOperatorPaymentsAsync(string operatorId, int take = 50)
            => await _payRepo.GetByOperatorAsync(operatorId, take);

        public async Task<object> GetOperatorBalanceAsync(string operatorId)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản thanh toán");
            var res = await _x.GetAsync("/balance", acc.XenditUserId);
            var json = await res.Content.ReadAsStringAsync();
            res.EnsureSuccessStatusCode();
            return System.Text.Json.JsonSerializer.Deserialize<object>(json);
        }

        public async Task<RefundRecord> RefundAsync(string operatorId, string xenditInvoiceId, long amount)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản thanh toán");

            var body = new { invoice_id = xenditInvoiceId, amount = amount };
            var res = await _x.PostAsync("/refunds", body, acc.XenditUserId); // Unified refunds (test)
            var json = await res.Content.ReadAsStringAsync();
            res.EnsureSuccessStatusCode();

            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var rid = doc.RootElement.GetProperty("id").GetString();
            var status = doc.RootElement.GetProperty("status").GetString();

            var rf = new RefundRecord
            {
                PaymentId = (await _payRepo.GetByInvoiceIdAsync(xenditInvoiceId))?.Id,
                XenditRefundId = rid,
                Amount = amount,
                Status = status
            };
            await _refundRepo.AddAsync(rf);
            return rf;
        }
    }

}
