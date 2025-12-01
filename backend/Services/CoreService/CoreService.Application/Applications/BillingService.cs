using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class BillingService : IBillingService
    {
        private readonly IParkingLotOperatorRepository _operatorRepo; // Giả định Repository cho Operator
        private readonly IPaymentRecordRepo _paymentRepo;
        private readonly ISubscriptionPlanRepository _planRepo;
        private readonly IPaymentApp _paymentApp; // Dùng để gọi tạo hóa đơn
        private readonly ILogger<BillingService> _logger;
        private readonly IAccountApplication _accountApp;
        private readonly IAccountRepository _accountRepo;


        public BillingService(
            IParkingLotOperatorRepository operatorRepo,
            IPaymentRecordRepo paymentRepo,
            ISubscriptionPlanRepository planRepo,
            IPaymentApp paymentApp,
            ILogger<BillingService> logger, IAccountApplication accountApp, IAccountRepository accountRepo)
        {
            _operatorRepo = operatorRepo;
            _paymentRepo = paymentRepo;
            _planRepo = planRepo;
            _paymentApp = paymentApp;
            _logger = logger;
            _accountApp = accountApp;
            _accountRepo = accountRepo;
        }

        public async Task RunMonthlyBillingAndSuspensionJobAsync()
        {
            _logger.LogInformation("Bắt đầu Job thanh toán định kỳ và giám sát khóa tài khoản.");

            var today = DateTime.Today.Date; // Ngày 1 của tháng hiện tại (Ví dụ: 01/12/2025)
            var firstDayOfCurrentMonth = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            // XÁC ĐỊNH MỐC THỜI GIAN
            var currentMonth = DateTime.SpecifyKind(firstDayOfCurrentMonth, DateTimeKind.Utc); // <--- SỬA Ở ĐÂY               // T
            var penaltyCheckMonth = firstDayOfCurrentMonth.AddMonths(-1);  // T-1 (Tháng quá hạn 1 tháng)
            var suspensionCheckMonth = firstDayOfCurrentMonth.AddMonths(-2); // T-2 (Tháng quá hạn 2 tháng)
            var currentDueDate = new DateTime(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));

            // Lấy tất cả Operator để xử lý (chủ yếu là Active hoặc chưa bị khóa)
            var operators = await _operatorRepo.GetAllAsync();

            foreach (var op in operators)
            {
                if (op.SubscriptionPlanId == null) continue;

                SubscriptionPlan? plan = null;
                try
                {
                    plan = await _planRepo.GetByIdAsync(op.SubscriptionPlanId);
                    if (plan == null) throw new Exception("Không tìm thấy gói phí");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi lấy gói phí cho Operator {OperatorId}", op.Id);
                    continue;
                }

                // --- 1. PHA BILLING (Tạo Hóa đơn tháng T) ---
                if (op.IsSuspended == false)
                {
                    // 🛑 BƯỚC BỔ SUNG: KIỂM TRA HÓA ĐƠN ĐÃ CÓ CHO THÁNG NÀY CHƯA
                    var existingInvoice = await _paymentRepo.GetMainInvoiceForMonth(op.Id, currentMonth);

                    if (existingInvoice != null)
                    {
                        // Bỏ qua nếu hóa đơn đã có, bất kể trạng thái.
                        _logger.LogInformation("Bỏ qua: Đã có hóa đơn OPR {InvoiceId} cho tháng {Month} của Operator {OperatorId}. Status: {Status}. Không tạo trùng.", existingInvoice.Id, currentMonth, op.Id, existingInvoice.Status);
                        // CHUYỂN SANG PHA TIẾP THEO (Penalty/Suspension)
                    }
                    else
                    {
                        // Logic tạo hóa đơn chỉ chạy nếu chưa tồn tại
                        _logger.LogDebug("Tạo hóa đơn tháng {Month} cho Operator {OperatorId}", currentMonth, op.Id);
                        try
                        {
                            // LƯU Ý: CẦN THÊM LOGIC MIỄN PHÍ THÁNG ĐẦU TIÊN Ở ĐÂY

                            await _paymentApp.CreateInvoiceAsync(
                                op.Id,
                                plan.MonthlyFeeAmount,
                                currentDueDate,
                                PaymentType.OperatorCharge,
                                currentMonth
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Lỗi tạo hóa đơn OPR tháng {Month} cho {OperatorId}", currentMonth, op.Id);
                        }
                    }
                }

                // --- 2. PHA PENALTY (Tạo Hóa đơn phạt cho tháng T-1) ---
                // Điều kiện: Hóa đơn T-1 chưa thanh toán
                var overdueMainInvoiceT1 = await _paymentRepo.GetUnpaidMainInvoiceForMonth(op.Id, penaltyCheckMonth);

                if (overdueMainInvoiceT1 != null)
                {
                    var existingPenaltyInvoice = await _paymentRepo.GetPenaltyInvoiceForRelatedInvoice(overdueMainInvoiceT1.Id);

                    if (existingPenaltyInvoice == null && plan.PenaltyFeeAmount > 0)
                    {
                        _logger.LogInformation("Tạo hóa đơn phạt cho hóa đơn chính {InvoiceId}", overdueMainInvoiceT1.Id);
                        try
                        {
                            // Ngày đáo hạn hóa đơn phạt có thể là cuối tháng T
                            await _paymentApp.CreatePenaltyInvoiceAsync(
                                op.Id,
                                plan.PenaltyFeeAmount,
                                currentDueDate,
                                overdueMainInvoiceT1
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Lỗi tạo hóa đơn phạt cho hóa đơn chính {InvoiceId}", overdueMainInvoiceT1.Id);
                        }
                    }
                }

                // --- 3. PHA SUSPENSION (Khóa tài khoản cho tháng T-2) ---
                // Điều kiện: Hóa đơn T-2 (OPR) UNPAID VÀ Hóa đơn phạt (PEN) UNPAID
                var suspensionMainInvoiceT2 = await _paymentRepo.GetUnpaidMainInvoiceForMonth(op.Id, suspensionCheckMonth);

                if (suspensionMainInvoiceT2 != null)
                {
                    var relatedPenaltyInvoice = await _paymentRepo.GetPenaltyInvoiceForRelatedInvoice(suspensionMainInvoiceT2.Id);

                    bool isPenaltyUnpaidOrMissing = relatedPenaltyInvoice == null || relatedPenaltyInvoice.Status != "PAID";

                    if (isPenaltyUnpaidOrMissing && op.IsSuspended == false)
                    {
                        _logger.LogWarning("Khóa tài khoản Operator {OperatorId} do nợ quá hạn 2 tháng: {MainInvoiceId}", op.Id, suspensionMainInvoiceT2.Id);
                        // Cập nhật trạng thái IsSuspended=true và các logic nghiệp vụ khác
                        op.IsSuspended = true;
                        await _operatorRepo.UpdateAsync(op);
                        var acc = await _accountRepo.GetByIdAsync(op.AccountId);
                        acc.IsActive = false;
                        await _accountRepo.UpdateAsync(acc);
                    }
                }
            }
            _logger.LogInformation("Job thanh toán định kỳ hoàn thành.");
        }
    }
}
