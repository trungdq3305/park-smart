using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PaymentDtos
{
    public class SubscriptionInvoiceDto
    {
        public string EntityId { get; set; }

        // Số tiền cần thanh toán (Phí định kỳ)
        public long Amount { get; set; }

        // Thời gian đáo hạn (Bắt buộc cho phí định kỳ)
        public DateTime DueDate { get; set; }
    }
}
