using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PaymentDtos
{
    public class OperatorPaymentDetailDto
    {
        // 1. Dữ liệu từ PaymentRecord
        public string Id { get; set; }
        public PaymentType PaymentType { get; set; }
        public string OperatorId { get; set; }
        public string XenditInvoiceId { get; set; }
        public long Amount { get; set; } // Số tiền giao dịch ban đầu
        public string Status { get; set; }
        public string CheckoutUrl { get; set; }
        public DateTime CreatedAt { get; set; }

        // 2. Dữ liệu Refund đi kèm
        public long TotalRefundedAmount { get; set; } = 0;
        public IEnumerable<RefundRecordDto> RefundHistory { get; set; } = new List<RefundRecordDto>();
    }

    // DTO đơn giản cho Refund (tránh trả về toàn bộ RefundRecord model)
    public class RefundRecordDto
    {
        public string XenditRefundId { get; set; }
        public long Amount { get; set; }
        public string Status { get; set; }
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
