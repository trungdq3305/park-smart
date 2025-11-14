using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.DashboardDtos;
using CoreService.Application.DTOs.PaymentDtos.CoreService.Application.DTOs.PaymentDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
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
        private readonly IAccountApplication _accountApp;
        private readonly IAccountRepository _accountRepo;

        public PaymentApp(IXenditClient x,
            IOperatorPaymentAccountRepo accRepo,
            IPaymentRecordRepo payRepo,
            IRefundRecordRepo refundRepo,
            IAccountApplication accountApp)
        {
            _x = x; _accRepo = accRepo; _payRepo = payRepo; _refundRepo = refundRepo;
            _accountApp = accountApp;
        }

        public async Task<PaymentRecord> CreatePaymentInvoiceAsync(
    string operatorId, string entityId, string accountId, long amount, PaymentType type)
        {
            // 1. Chuẩn bị dữ liệu định danh (PREFIX và DESCRIPTION)

            string externalIdPrefix;
            string description;

            switch (type)
            {
                case PaymentType.Reservation:
                    externalIdPrefix = "RES";
                    description = $"Reservation #{entityId}";
                    break;
                case PaymentType.Subscription:
                    externalIdPrefix = "SUB";
                    description = $"Subscription #{entityId}";
                    break;
                case PaymentType.ParkingLotSession:
                    externalIdPrefix = "SES";
                    description = $"Parking Session #{entityId}";
                    break;
                default:
                    throw new ArgumentException("Loại thanh toán không hợp lệ.");
            }

            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                                     ?? throw new ApiException("Operator chưa có tài khoản thanh toán");

            // 1) Kiểm tra trạng thái sub-account (Giữ nguyên logic kiểm tra LIVE)
            var check = await _x.GetAsync($"/v2/accounts/{acc.XenditUserId}");
            var checkBody = await check.Content.ReadAsStringAsync();
            // Thêm logic kiểm tra LIVE ở đây
            using (var d = JsonDocument.Parse(checkBody))
            {
                var st = d.RootElement.GetProperty("status").GetString();
                if (!string.Equals(st, "REGISTERED", StringComparison.OrdinalIgnoreCase))
                    throw new ApiException($"Tài khoản thanh toán của operator chưa ACTIVE (hiện: {st}). Hãy mở email mời và Accept.");
            }

            // 2) Tạo invoice
            var externalId = $"{externalIdPrefix}-{entityId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            var baseReturn = "https://parksmart.vn/pay-result"; // <-- đổi theo project
            var pr = new PaymentRecord
            {
                OperatorId = operatorId,
                ExternalId = externalId,
                Amount = amount,
                XenditUserId = acc.XenditUserId,
                CreatedBy = accountId,
                CreatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow),

                // GÁN LOẠI THANH TOÁN (ENUM) VÀ ID TƯƠNG ỨNG
                PaymentType = type,
                ReservationId = (type == PaymentType.Reservation) ? entityId : null,
                SubscriptionId = (type == PaymentType.Subscription) ? entityId : null,
                ParkingLotSessionId = (type == PaymentType.ParkingLotSession) ? entityId : null,

                // Gán trạng thái ban đầu (Pending/Created/Draft)
                Status = "CREATED", // Tùy thuộc vào cấu trúc dữ liệu của bạn
            };
            // LƯU VÀO DB ĐỂ CÓ ID THẬT
            await _payRepo.AddAsync(pr); // <--- LƯU TRƯỚC
            var paymentId = pr.Id;
            // Tạo successUrl và failureUrl (truyền cả PaymentType qua URL)
            var successUrl = $"{baseReturn}?result=success" +
                             $"&entityId={Uri.EscapeDataString(entityId)}" +
                             $"&operatorId={Uri.EscapeDataString(operatorId)}" +
                             $"&externalId={Uri.EscapeDataString(externalId)}" +
                             $"&accountId={Uri.EscapeDataString(accountId)}" +
                             $"&paymentId={Uri.EscapeDataString(paymentId)}" +
                             $"&type={type}"; // THÊM TYPE

            var failureUrl = $"{baseReturn}?result=failure" +
                             $"&entityId={Uri.EscapeDataString(entityId)}" +
                             $"&operatorId={Uri.EscapeDataString(operatorId)}" +
                             $"&externalId={Uri.EscapeDataString(externalId)}" +
                             $"&accountId={Uri.EscapeDataString(accountId)}" +
                             $"&paymentId={Uri.EscapeDataString(paymentId)}" +
                             $"&type={type}"; // THÊM TYPE

            var body = new
            {
                external_id = externalId,
                amount = amount,
                currency = "VND",
                description = description,
                success_redirect_url = successUrl,
                failure_redirect_url = failureUrl,
                should_send_email = false,
                invoice_duration = 600
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

            // 3. Tạo PaymentRecord (CẬP NHẬT GÁN ID và TYPE)
            pr.XenditInvoiceId = invoiceId;
            pr.Status = status; // Trạng thái ban đầu từ Xendit thường là PENDING/ACTIVE
            pr.CheckoutUrl = url;

            await _payRepo.UpdateAsync(pr);
            return pr;
        }

        //    public async Task<PaymentRecord> CreateReservationInvoiceAsync(
        //string operatorId, string reservationId, string accountId, long amount)
        //    {
        //        var acc = await _accRepo.GetByOperatorAsync(operatorId)
        //                    ?? throw new ApiException("Operator chưa có tài khoản thanh toán");

        //        // 1) Kiểm tra trạng thái sub-account
        //        var check = await _x.GetAsync($"/v2/accounts/{acc.XenditUserId}");
        //        var checkBody = await check.Content.ReadAsStringAsync();
        //        if (!check.IsSuccessStatusCode)
        //            throw new ApiException($"Không kiểm tra được tài khoản Xendit: {check.StatusCode} {checkBody}");

        //        using (var d = JsonDocument.Parse(checkBody))
        //        {
        //            var st = d.RootElement.GetProperty("status").GetString();
        //            if (!string.Equals(st, "LIVE", StringComparison.OrdinalIgnoreCase))
        //                throw new ApiException($"Tài khoản thanh toán của operator chưa ACTIVE (hiện: {st}). Hãy mở email mời và Accept.");
        //        }

        //        // 2) Tạo invoice
        //        var externalId = $"RES-{reservationId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        //        var baseReturn = "https://parksmart.vn/pay-result"; // <-- đổi theo project

        //        // bạn có thể truyền đủ thông tin để front hiển thị & gọi confirm:
        //        var successUrl = $"{baseReturn}?result=success" +
        //                         $"&reservationId={Uri.EscapeDataString(reservationId)}" +
        //                         $"&operatorId={Uri.EscapeDataString(operatorId)}" +
        //                         $"&externalId={Uri.EscapeDataString(externalId)}" +
        //                         $"&accountId={Uri.EscapeDataString(accountId)}";

        //        var failureUrl = $"{baseReturn}?result=failure" +
        //                         $"&reservationId={Uri.EscapeDataString(reservationId)}" +
        //                         $"&operatorId={Uri.EscapeDataString(operatorId)}" +
        //                         $"&externalId={Uri.EscapeDataString(externalId)}" +
        //                         $"&accountId={Uri.EscapeDataString(accountId)}";
        //        var body = new
        //        {
        //            external_id = externalId,
        //            amount = amount,
        //            currency = "VND",
        //            description = $"Reservation #{reservationId}",
        //            success_redirect_url = successUrl,
        //            failure_redirect_url = failureUrl,
        //            should_send_email = false,
        //            invoice_duration = 60 
        //        };

        //        var res = await _x.PostAsync("/v2/invoices", body, forUserId: acc.XenditUserId);
        //        var json = await res.Content.ReadAsStringAsync();

        //        // Log lỗi rõ ràng nếu 4xx/5xx
        //        if (!res.IsSuccessStatusCode)
        //            throw new ApiException($"Xendit tạo invoice lỗi: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {json}");

        //        using var doc = JsonDocument.Parse(json);
        //        var invoiceId = doc.RootElement.GetProperty("id").GetString();
        //        var status = doc.RootElement.GetProperty("status").GetString();
        //        var url = doc.RootElement.GetProperty("invoice_url").GetString();

        //        var pr = new PaymentRecord
        //        {
        //            ReservationId = reservationId,
        //            OperatorId = operatorId,
        //            XenditInvoiceId = invoiceId,
        //            ExternalId = externalId,
        //            Amount = amount,
        //            Status = status,
        //            XenditUserId = acc.XenditUserId, // hoặc đổi tên field trong model
        //            CheckoutUrl = url,
        //            CreatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow),
        //            CreatedBy = accountId
        //        };
        //        await _payRepo.AddAsync(pr);
        //        return pr;
        //    }


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


        public async Task<ApiResponse<RefundRecord>> RefundByPaymentIdAsync(
    string operatorId,
    string paymentId, string accountId,    // Tham số mới: ID của PaymentRecord
    long amount,
    string? reason = null)
        {
            // 1) Lấy sub-account + PaymentRecord

            // Lấy sub-account của Operator
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                         ?? throw new ApiException("Operator chưa có tài khoản thanh toán");

            // Lấy Payment Record từ ID
            // Lấy Payment Record từ ID
            var pr = await _payRepo.GetByIdAsync(paymentId)
                         ?? throw new ApiException("Không tìm thấy Payment Record với ID này");

            // Kiểm tra tính hợp lệ của Payment Record (Optional: có thể kiểm tra thêm)
            if (pr.OperatorId != operatorId)
                throw new ApiException("Payment Record không thuộc Operator này.");

            if (string.IsNullOrWhiteSpace(pr.XenditInvoiceId))
                throw new ApiException("Payment không có InvoiceId để hoàn tiền");

            // (tuỳ nhu cầu) chặn nếu payment chưa thành công
            // if (!string.Equals(pr.Status, "PAID", StringComparison.OrdinalIgnoreCase) &&
            //     !string.Equals(pr.Status, "SETTLED", StringComparison.OrdinalIgnoreCase))
            //     throw new ApiException($"Không thể hoàn tiền khi trạng thái thanh toán là {pr.Status}");

            // 2) Gọi Unified Refunds (Giữ nguyên logic Xendit)
            var body = new
            {
                invoice_id = pr.XenditInvoiceId,
                amount = amount,
                reason = reason
            };

            // chống tạo trùng refund
            var idem = $"rf-{pr.XenditInvoiceId}-{amount}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"; // Thêm timestamp để đảm bảo tính duy nhất

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
                // Dựa vào Model PaymentRecord đã cập nhật: chỉ có 1 trong 3 trường này được điền
                ReservationId = pr.ReservationId,
                SubscriptionId = pr.SubscriptionId,
                ParkingLotSessionId = pr.ParkingLotSessionId,

                XenditRefundId = refundId,
                Amount = rAmount,
                Status = rStatus,
                Reason = reason,
                CreatedBy = accountId,
                CreatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow) // Sử dụng TimeConverter
            };
            await _refundRepo.AddAsync(rf);

            // (tuỳ nhu cầu) cập nhật trạng thái payment khi refund full:
            // if (rAmount >= pr.Amount) { pr.Status = "REFUNDED"; await _payRepo.UpdateAsync(pr); }

            return new ApiResponse<RefundRecord>(rf, true, "Hoàn tiền đã được xử lý thành công.", StatusCodes.Status201Created);
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

        // trong PaymentApp
        public async Task<PaymentRecord?> GetLatestPaymentByReservationAsync(string reservationId)
            => await _payRepo.GetLatestByReservationIdAsync(reservationId);

        public async Task<string> GetInvoiceStatusAsync(string operatorId, string invoiceId)
        {
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản Xendit");

            var res = await _x.GetAsync($"/v2/invoices/{invoiceId}", acc.XenditUserId);
            var json = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit get invoice error {res.StatusCode}: {json}");

            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var status = doc.RootElement.TryGetProperty("status", out var st) ? st.GetString() : "UNKNOWN";
            return status ?? "UNKNOWN";
        }

        public async Task UpdatePaymentStatusAsync(string invoiceId, string newStatus)
        {
            var pr = await _payRepo.GetByIdAsync(invoiceId);
            if (pr == null) return;
            pr.Status = newStatus;
            pr.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow); ;
            await _payRepo.UpdateAsync(pr);
        }

        public async Task<PaymentRecord> GetByIdAsync(string Id)
        {
            // Giả định _payRepo có phương thức tìm kiếm theo ExternalId
            var pr = await _payRepo.GetByIdAsync(Id);

            return pr;
        }
        public async Task<IEnumerable<PaymentRecord>> GetByCreatedByAsync(string accountId)
        {
            // Giả định _payRepo có phương thức tìm kiếm theo CreatedBy và trả về List/IEnumerable
            var records = await _payRepo.GetByCreatedByAsync(accountId);

            // Trả về danh sách (có thể là danh sách trống nếu không tìm thấy)
            return records;
        }
        public async Task<IEnumerable<RefundRecord>> GetRefundsByCreatedByAsync(string accountId, int take = 50)
        {
            // Giả định _refundRepo đã được inject và có phương thức GetByCreatedByAsync
            return await _refundRepo.GetByCreatedByAsync(accountId, take);
        }
    

    public async Task<PaymentRecord> CreateSubscriptionInvoiceAsync(
    string operatorId, string entityId, 
    long amount, DateTime dueDate)
        {
            // Dùng lại logic từ CreatePaymentInvoiceAsync nhưng gán cứng PaymentType

            const PaymentType type = PaymentType.OperatorCharge;
            const string externalIdPrefix = "SUB";
            var description = $"Subscription Fee for {operatorId} (Due: {dueDate:yyyy-MM})";

            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                                 ?? throw new ApiException("Operator chưa có tài khoản thanh toán");
            var account = await _accountApp.GetByOperatorIdAsync(operatorId) ?? throw new ApiException("không tìm thấy tài khoản của operator");
            var accountId = account.Data.Id;
            // Hoặc giá trị phù hợp nếu cần
            // 1) Kiểm tra trạng thái sub-account (Giữ nguyên logic kiểm tra LIVE)
            // ... (logic kiểm tra LIVE status) ...

            // 2) Tạo invoice
            var externalId = $"{externalIdPrefix}-{entityId}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            var baseReturn = "https://parksmart.vn/pay-result";

            // ... (logic tạo successUrl và failureUrl - giữ nguyên) ...
            var successUrl = $"{baseReturn}?result=success&entityId={Uri.EscapeDataString(entityId)}&operatorId={Uri.EscapeDataString(operatorId)}&externalId={Uri.EscapeDataString(externalId)}&accountId={Uri.EscapeDataString(accountId)}&type={type}";
            var failureUrl = $"{baseReturn}?result=failure&entityId={Uri.EscapeDataString(entityId)}&operatorId={Uri.EscapeDataString(operatorId)}&externalId={Uri.EscapeDataString(externalId)}&accountId={Uri.EscapeDataString(accountId)}&type={type}";

            // Payload Xendit. QUAN TRỌNG: Thêm fees để chuyển tiền về Master Account (tài khoản CoreService)
            var body = new
            {
                external_id = externalId,
                amount = amount,
                currency = "VND",
                description = description,
                success_redirect_url = successUrl,
                failure_redirect_url = failureUrl,
                should_send_email = false,
                invoice_duration = 60,
                // CƠ CHẾ THU PHÍ NỀN TẢNG: Chuyển toàn bộ amount về tài khoản Master
                fees = new[]
                {
            new
            {
                type = "TRANSFER",
                value = amount // Toàn bộ số tiền (phí định kỳ)
            }
        }
            };

            var res = await _x.PostAsync("/v2/invoices", body, forUserId: acc.XenditUserId);
            var json = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                throw new ApiException($"Xendit tạo invoice lỗi: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {json}");

            // ... (logic parse json, lấy invoiceId, status, url) ...
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var invoiceId = doc.RootElement.GetProperty("id").GetString();
            var status = doc.RootElement.GetProperty("status").GetString();
            var url = doc.RootElement.GetProperty("invoice_url").GetString();


            // 3. Tạo PaymentRecord và lưu DB
            var pr = new PaymentRecord
            {
                OperatorId = operatorId,
                XenditInvoiceId = invoiceId,
                ExternalId = externalId,
                Amount = amount,
                Status = status,
                XenditUserId = acc.XenditUserId,
                CheckoutUrl = url,
                CreatedBy = accountId,
                CreatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow),

                PaymentType = type,
                SubscriptionId = entityId,
                DueDate = dueDate, // LƯU NGÀY ĐÁO HẠN
            };
            await _payRepo.AddAsync(pr);
            return pr;
        }
        public async Task<IEnumerable<PaymentRecord>> GetSubscriptionInvoicesByStatusAsync(
    string operatorId, IEnumerable<string> statuses)
        {
            // Giả định _payRepo có method để lọc theo 3 trường này:
            // 1. OperatorId
            // 2. PaymentType == Subscription
            // 3. Status nằm trong danh sách (e.g., PENDING, EXPIRED)

            // Phương thức này cần được thêm vào IPaymentRecordRepo và triển khai (ví dụ: dùng LINQ/MongoDB filter)
            var records = await _payRepo.GetByTypeAndStatusAsync(
                operatorId, PaymentType.Subscription, statuses);

            return records;
        }
        public async Task<string> GetOperatorAccountStatusAsync(string operatorId)
        {
            // 1. Lấy Xendit User ID (XenditUserId) của Operator
            var acc = await _accRepo.GetByOperatorAsync(operatorId)
                                    ?? throw new ApiException("Operator chưa có tài khoản Xendit");

            // 2. Gọi Xendit API để lấy chi tiết tài khoản
            // Endpoint: GET /v2/accounts/{user_id}
            var res = await _x.GetAsync($"/v2/accounts/{acc.XenditUserId}");
            var checkBody = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
            {
                // Xử lý lỗi API nếu có
                throw new ApiException($"Lỗi khi kiểm tra tài khoản Xendit {res.StatusCode}: {checkBody}");
            }

            // 3. Phân tích JSON Response để lấy trường "status"
            using (var d = JsonDocument.Parse(checkBody))
            {
                if (d.RootElement.TryGetProperty("status", out var statusElement))
                {
                    var status = statusElement.GetString();
                    return status ?? "UNKNOWN";
                }
                else
                {
                    return "STATUS_FIELD_NOT_FOUND";
                }
            }
        }
        public async Task<object> GetXenditInvoiceDetailAsync(string paymentId)
        {
            var record = await _payRepo.GetByIdAsync(paymentId);
            
            // 1. Gọi Xendit API để lấy chi tiết Hóa đơn
            // Endpoint: GET /v2/invoices/{invoice_id}
            var acc = await _accRepo.GetByOperatorAsync(record.OperatorId)
                      ?? throw new ApiException("Operator chưa có tài khoản Xendit");

            var res = await _x.GetAsync($"/v2/invoices/{record.XenditInvoiceId}", acc.XenditUserId);

            
            var checkBody = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
            {
                // Xử lý lỗi API nếu hóa đơn không tồn tại hoặc lỗi khác
                throw new ApiException($"Lỗi khi kiểm tra hóa đơn Xendit {res.StatusCode}: {checkBody}", (int)res.StatusCode);
            }

            // 2. Phân tích JSON Response để lấy các trường mong muốn
            using (var d = JsonDocument.Parse(checkBody))
            {
                var root = d.RootElement;

                // Trạng thái hóa đơn (PAID, PENDING, EXPIRED, v.v.)
                var status = root.TryGetProperty("status", out var statusElement)
                             ? statusElement.GetString() : "UNKNOWN";

                // Số tiền
                var amount = root.TryGetProperty("amount", out var amountElement)
                             ? amountElement.GetInt64() : 0;

                //var record = await _payRepo.GetByInvoiceIdAsync(xenditInvoiceId);



                return new
                {
                    status = status,
                    amount = amount,
                    // Sử dụng email/externalId làm ID định danh người trả tiền
                    userId = record.CreatedBy
                };
            }
        }
        public async Task<IEnumerable<PaymentRecord>> GetByCreatedByAndStatusAsync(
    string accountId,
    string status)
        {
            // Có thể thêm logic validation ở đây nếu cần

            // Gọi Repository (Giả định bạn muốn giới hạn 50 bản ghi)
            var records = await _payRepo.GetByCreatedByAndStatusAsync(accountId, status, 50);

            return records;
        }

    //    public async Task<IEnumerable<SaasRevenueDetailDto>> GetSaasRevenueForAdminAsync(
    //DateTime? from, DateTime? to)
    //    {
    //        // 1. Lấy tất cả PaymentRecord loại OperatorCharge trong khoảng thời gian
    //        var records = await _payRepo.GetOperatorChargesAsync(from, to);
    //        // (Giả định có method này trong Repo)

    //        // 2. Lấy tất cả thông tin Operator liên quan
    //        var operatorIds = records.Select(r => r.OperatorId).Distinct().ToList();
    //        var operators = await _operatorRepo.GetByIdsAsync(operatorIds);
    //        var operatorsDict = operators.ToDictionary(o => o.Id);

    //        // 3. Mapping và trả về
    //        var result = new List<SaasRevenueDetailDto>();
    //        foreach (var record in records.OrderByDescending(r => r.CreatedAt))
    //        {
    //            if (operatorsDict.TryGetValue(record.OperatorId, out var op))
    //            {
    //                result.Add(new SaasRevenueDetailDto
    //                {
    //                    OperatorName = op.FullName,
    //                    OperatorBusinessName = op.BussinessName,
    //                    PaymentId = record.Id,
    //                    Amount = record.Amount,
    //                    DueDate = record.DueDate ?? DateTime.MinValue,
    //                    Status = record.Status,
    //                    CreatedAt = record.CreatedAt
    //                });
    //            }
    //        }
    //        return result;
    //    }

    //    public async Task<IEnumerable<DriverRevenueDetailDto>> GetDriverRevenueForOperatorAsync(
    //string operatorId, DateTime? from, DateTime? to)
    //    {
    //        // 1. Lấy PaymentRecord cho OperatorId, loại trừ OperatorCharge
    //        var records = await _payRepo.GetPaymentsByOperatorExcludingChargeAsync(
    //            operatorId, from, to);
    //        // (Giả định có method này trong Repo: Lấy RES, SUB, SES)

    //        // 2. Lấy tất cả Driver Account liên quan (CreatedBy là AccountId của Driver)
    //        var createdByAccountIds = records.Select(r => r.CreatedBy).Distinct().ToList();

    //        // Chú ý: Bạn cần method trong AccountApplication hoặc Repo để lấy Driver và Account
    //        // Giả định bạn có: IDriverRepository.GetByAccountIdsAsync(createdByAccountIds)
    //        var drivers = await _driverRepo.GetByAccountIdsAsync(createdByAccountIds);
    //        var accounts = await _accountRepo.GetByIdsAsync(createdByAccountIds);

    //        var driversDict = drivers.ToDictionary(d => d.AccountId);
    //        var accountsDict = accounts.ToDictionary(a => a.Id);

    //        // 3. Mapping và trả về
    //        var result = new List<DriverRevenueDetailDto>();
    //        foreach (var record in records.OrderByDescending(r => r.CreatedAt))
    //        {
    //            if (accountsDict.TryGetValue(record.CreatedBy, out var acc) &&
    //                driversDict.TryGetValue(record.CreatedBy, out var driver))
    //            {
    //                result.Add(new DriverRevenueDetailDto
    //                {
    //                    DriverName = driver.FullName,
    //                    DriverPhoneNumber = acc.PhoneNumber,
    //                    Amount = record.Amount,
    //                    PaymentType = record.PaymentType.ToString(),
    //                    Status = record.Status,
    //                    CreatedAt = record.CreatedAt
    //                });
    //            }
    //        }
    //        return result;
    //    }
    //    public async Task<IEnumerable<SaasRevenueDetailDto>> GetSaasRevenueForAdminAsync(
    //DateTime? from, DateTime? to)
    //    {
    //        // 1. Lấy tất cả PaymentRecord loại OperatorCharge trong khoảng thời gian
    //        var records = await _payRepo.GetOperatorChargesAsync(from, to);
    //        // (Giả định có method này trong Repo)

    //        // 2. Lấy tất cả thông tin Operator liên quan
    //        var operatorIds = records.Select(r => r.OperatorId).Distinct().ToList();
    //        var operators = await _operatorRepo.GetByIdsAsync(operatorIds);
    //        var operatorsDict = operators.ToDictionary(o => o.Id);

    //        // 3. Mapping và trả về
    //        var result = new List<SaasRevenueDetailDto>();
    //        foreach (var record in records.OrderByDescending(r => r.CreatedAt))
    //        {
    //            if (operatorsDict.TryGetValue(record.OperatorId, out var op))
    //            {
    //                result.Add(new SaasRevenueDetailDto
    //                {
    //                    OperatorName = op.FullName,
    //                    OperatorBusinessName = op.BussinessName,
    //                    PaymentId = record.Id,
    //                    Amount = record.Amount,
    //                    DueDate = record.DueDate ?? DateTime.MinValue,
    //                    Status = record.Status,
    //                    CreatedAt = record.CreatedAt
    //                });
    //            }
    //        }
    //        return result;
    //    }

    //    public async Task<IEnumerable<DriverRevenueDetailDto>> GetDriverRevenueForOperatorAsync(
    //string operatorId, DateTime? from, DateTime? to)
    //    {
    //        // 1. Lấy PaymentRecord cho OperatorId, loại trừ OperatorCharge
    //        var records = await _payRepo.GetPaymentsByOperatorExcludingChargeAsync(
    //            operatorId, from, to);
    //        // (Giả định có method này trong Repo: Lấy RES, SUB, SES)

    //        // 2. Lấy tất cả Driver Account liên quan (CreatedBy là AccountId của Driver)
    //        var createdByAccountIds = records.Select(r => r.CreatedBy).Distinct().ToList();

    //        // Chú ý: Bạn cần method trong AccountApplication hoặc Repo để lấy Driver và Account
    //        // Giả định bạn có: IDriverRepository.GetByAccountIdsAsync(createdByAccountIds)
    //        var drivers = await _driverRepo.GetByAccountIdsAsync(createdByAccountIds);
    //        var accounts = await _accountRepo.GetByIdsAsync(createdByAccountIds);

    //        var driversDict = drivers.ToDictionary(d => d.AccountId);
    //        var accountsDict = accounts.ToDictionary(a => a.Id);

    //        // 3. Mapping và trả về
    //        var result = new List<DriverRevenueDetailDto>();
    //        foreach (var record in records.OrderByDescending(r => r.CreatedAt))
    //        {
    //            if (accountsDict.TryGetValue(record.CreatedBy, out var acc) &&
    //                driversDict.TryGetValue(record.CreatedBy, out var driver))
    //            {
    //                result.Add(new DriverRevenueDetailDto
    //                {
    //                    DriverName = driver.FullName,
    //                    DriverPhoneNumber = acc.PhoneNumber,
    //                    Amount = record.Amount,
    //                    PaymentType = record.PaymentType.ToString(),
    //                    Status = record.Status,
    //                    CreatedAt = record.CreatedAt
    //                });
    //            }
    //        }
    //        return result;
    //    }
    }
    
    }