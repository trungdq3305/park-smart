using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.PaymentDtos.CoreService.Application.DTOs.PaymentDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
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
                if (!string.Equals(st, "LIVE", StringComparison.OrdinalIgnoreCase))
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


        //public async Task<IEnumerable<PaymentRecord>> GetOperatorPaymentsAsync(string operatorId, int take = 50)
        //    => await _payRepo.GetByOperatorAsync(operatorId, take);

        //public async Task<object> GetOperatorBalanceAsync(string operatorId)
        //{
        //    var acc = await _accRepo.GetByOperatorAsync(operatorId)
        //              ?? throw new ApiException("Operator chưa có tài khoản thanh toán");
        //    var res = await _x.GetAsync("/balance", acc.XenditUserId);
        //    var json = await res.Content.ReadAsStringAsync();
        //    res.EnsureSuccessStatusCode();
        //    return System.Text.Json.JsonSerializer.Deserialize<object>(json);
        //}
        public async Task<BalanceDto> GetOperatorBalanceAsync(string operatorId)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản Xendit");

            // Xendit balance endpoint
            // /balance?account_type=CASH   (dành cho ví tiền; dùng for-user-id để lấy theo sub-account)
            var res = await _x.GetAsync("/balance?account_type=CASH", acc.XenditUserId);
            var text = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit balance error {res.StatusCode}: {text}");

            using var doc = JsonDocument.Parse(text);
            var root = doc.RootElement;

            // các field có thể khác nhau giữa env => parse an toàn
            var dto = new BalanceDto
            {
                Currency = root.TryGetProperty("currency", out var cur) ? cur.GetString() ?? "VND" : "VND",
                AccountType = root.TryGetProperty("account_type", out var at) ? at.GetString() ?? "CASH" : "CASH",
                Available = root.TryGetProperty("balance", out var bal) ? bal.GetInt64()
                              : root.TryGetProperty("available_balance", out var av) ? av.GetInt64() : 0,
                Pending = root.TryGetProperty("pending_balance", out var pd) ? pd.GetInt64() : null
            };

            return dto;
        }

        public async Task<TransactionListDto> GetOperatorPaymentsAsync(
            string operatorId,
            DateTime? from = null, DateTime? to = null,
            int limit = 50)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản Xendit");

            var qs = new List<string>();
            if (from.HasValue) qs.Add($"created[gte]={new DateTimeOffset(from.Value).ToUnixTimeSeconds()}");
            if (to.HasValue) qs.Add($"created[lte]={new DateTimeOffset(to.Value).ToUnixTimeSeconds()}");
            qs.Add($"limit={Math.Clamp(limit, 1, 100)}");
            // có thể lọc thêm: &types=PAYMENT,DISBURSEMENT&statuses=SUCCEEDED,PENDING,FAILED
            var path = "/transactions" + (qs.Count > 0 ? "?" + string.Join("&", qs) : "");

            var res = await _x.GetAsync(path, acc.XenditUserId);
            var text = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit transactions error {res.StatusCode}: {text}");

            using var doc = JsonDocument.Parse(text);
            var root = doc.RootElement;

            var list = new List<TransactionItemDto>();
            if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Array)
            {
                foreach (var it in data.EnumerateArray())
                {
                    list.Add(new TransactionItemDto
                    {
                        Id = it.TryGetProperty("id", out var id) ? id.GetString() : null,
                        Type = it.TryGetProperty("type", out var ty) ? ty.GetString() : null,
                        Channel = it.TryGetProperty("channel_category", out var ch) ? ch.GetString()
                                 : it.TryGetProperty("channel", out var ch2) ? ch2.GetString() : null,
                        Amount = it.TryGetProperty("amount", out var am) ? am.GetInt64() : 0,
                        Currency = it.TryGetProperty("currency", out var cu) ? cu.GetString() : "VND",
                        Status = it.TryGetProperty("status", out var st) ? st.GetString() : null,
                        Reference = it.TryGetProperty("reference", out var rf) ? rf.GetString()
                                 : it.TryGetProperty("external_id", out var ex) ? ex.GetString() : null,
                        Created = it.TryGetProperty("created", out var cr) && cr.TryGetDateTime(out var dt) ? dt : DateTime.UtcNow,
                        SettlementStatus = it.TryGetProperty("settlement_status", out var ss) ? ss.GetString() : null
                    });
                }
            }

            return new TransactionListDto { Count = list.Count, Data = list };
        }
        public async Task<ApiResponse<RefundRecord>> RefundAsync(
    string operatorId,
    string reservationId,   // ƯU TIÊN refund theo reservation
    long amount,
    string? reason = null)
        {
            // 1) Lấy sub-account + payment (invoice) gần nhất của reservation
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản thanh toán");

            var pr = await _payRepo.GetLatestByReservationIdAsync(reservationId)
                     ?? throw new ApiException("Không tìm thấy payment của reservation");

            if (string.IsNullOrWhiteSpace(pr.XenditInvoiceId))
                throw new ApiException("Payment không có InvoiceId để hoàn tiền");

            // (tuỳ nhu cầu) chặn nếu payment chưa thành công
            // if (!string.Equals(pr.Status, "PAID", StringComparison.OrdinalIgnoreCase) &&
            //     !string.Equals(pr.Status, "SETTLED", StringComparison.OrdinalIgnoreCase))
            //     throw new ApiException($"Không thể hoàn tiền khi trạng thái thanh toán là {pr.Status}");

            // 2) Gọi Unified Refunds
            var body = new
            {
                invoice_id = pr.XenditInvoiceId,  // unified refunds hỗ trợ refund theo invoice_id
                amount = amount,
                reason = reason
            };

            // chống tạo trùng refund
            var idem = $"rf-{pr.XenditInvoiceId}-{amount}";

            var res = await _x.PostAsync("/refunds", body, forUserId: acc.XenditUserId, idempotencyKey: idem);
            var json = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit refund lỗi: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {json}");

            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            var refundId = root.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
            var rStatus = root.TryGetProperty("status", out var stEl) ? stEl.GetString() : null;
            var rAmount = root.TryGetProperty("amount", out var amEl) ? amEl.GetInt64() : amount;

            if (string.IsNullOrEmpty(refundId))
                throw new ApiException($"Không tìm thấy refund id trong response: {json}");

            // 3) Lưu DB
            var rf = new RefundRecord
            {
                PaymentId = pr.Id,
                ReservationId = pr.ReservationId,
                XenditRefundId = refundId,
                Amount = rAmount,
                Status = rStatus,
                Reason = reason,
                CreatedAt = DateTime.UtcNow
            };
            await _refundRepo.AddAsync(rf);

            // (tuỳ nhu cầu) cập nhật trạng thái payment khi refund full:
            // if (rAmount >= pr.Amount) { pr.Status = "REFUNDED"; await _payRepo.UpdateAsync(pr); }

            return new ApiResponse<RefundRecord>(rf, true, "FAQ đã được tạo, chờ Admin duyệt", StatusCodes.Status201Created);
        }
        public async Task<RefundRecord> RefundByInvoiceAsync(string operatorId, string invoiceId, long amount, string? reason = null)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản thanh toán");
            var pr = await _payRepo.GetByInvoiceIdAsync(invoiceId)
                     ?? throw new ApiException("Không tìm thấy payment theo invoice");

            var body = new { invoice_id = invoiceId, amount, reason };
            var res = await _x.PostAsync("/refunds", body, forUserId: acc.XenditUserId,
                                         idempotencyKey: $"rf-{invoiceId}-{amount}");
            var json = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit refund lỗi: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {json}");

            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var rid = doc.RootElement.GetProperty("id").GetString();
            var status = doc.RootElement.GetProperty("status").GetString();
            var rAmt = doc.RootElement.TryGetProperty("amount", out var am) ? am.GetInt64() : amount;

            var rf = new RefundRecord
            {
                PaymentId = pr.Id,
                ReservationId = pr.ReservationId,
                XenditRefundId = rid,
                Amount = rAmt,
                Status = status,
                Reason = reason,
                CreatedAt = DateTime.UtcNow
            };
            await _refundRepo.AddAsync(rf);
            return rf;
        }

        public async Task<PaymentTotalsDto> GetOperatorTotalsAsync(
    string operatorId, DateTime? from = null, DateTime? to = null)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản Xendit");

            var qs = new List<string>();
            if (from.HasValue) qs.Add($"created[gte]={new DateTimeOffset(from.Value).ToUnixTimeSeconds()}");
            if (to.HasValue) qs.Add($"created[lte]={new DateTimeOffset(to.Value).ToUnixTimeSeconds()}");
            // lấy tối đa 1000 bản ghi/lần. Nếu cần nhiều hơn thì bạn có thể phân trang (has_more + last_id).
            qs.Add("limit=1000");

            var res = await _x.GetAsync("/transactions" + (qs.Any() ? "?" + string.Join("&", qs) : ""), acc.XenditUserId);
            var text = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit transactions error {res.StatusCode}: {text}");

            using var doc = System.Text.Json.JsonDocument.Parse(text);
            var root = doc.RootElement;

            long incoming = 0, outgoing = 0;
            int cntIn = 0, cntOut = 0;
            string currency = "VND";

            if (root.TryGetProperty("data", out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                foreach (var it in arr.EnumerateArray())
                {
                    currency = it.TryGetProperty("currency", out var cur) ? (cur.GetString() ?? currency) : currency;
                    var amount = it.TryGetProperty("amount", out var am) ? am.GetInt64() : 0;

                    // 1) ưu tiên trường direction nếu có
                    if (it.TryGetProperty("direction", out var dirEl))
                    {
                        var dir = dirEl.GetString();
                        if (string.Equals(dir, "IN", StringComparison.OrdinalIgnoreCase))
                        { incoming += amount; cntIn++; continue; }
                        if (string.Equals(dir, "OUT", StringComparison.OrdinalIgnoreCase))
                        { outgoing += amount; cntOut++; continue; }
                    }

                    // 2) fallback: suy ra theo type
                    var type = it.TryGetProperty("type", out var tp) ? tp.GetString() ?? "" : "";
                    switch (type.ToUpperInvariant())
                    {
                        // money-in
                        case "PAYMENT":
                        case "TOPUP":
                        case "REFUND_REVERSAL":
                            incoming += amount; cntIn++; break;

                        // money-out
                        case "DISBURSEMENT":
                        case "PAYOUT":
                        case "REFUND":
                            outgoing += amount; cntOut++; break;

                        // các loại khác: bỏ qua hoặc tự xử lý tuỳ logic
                        default: break;
                    }
                }
            }

            return new PaymentTotalsDto
            {
                Incoming = incoming,
                Outgoing = outgoing,
                Currency = currency,
                CountIncoming = cntIn,
                CountOutgoing = cntOut
            };
        }

    }

}
