using Dotnet.Shared.Helpers;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Models
{
    public class PaymentRecord
    {
        [BsonId, BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string ReservationId { get; set; }  // R123
        [BsonRepresentation(BsonType.ObjectId)]
        public string OperatorId { get; set; }
        public string XenditInvoiceId { get; set; }
        public string ExternalId { get; set; }     // “RES-{ReservationId}-{ts}”
        public long Amount { get; set; }           // VND
        public string Currency { get; set; } = "VND";
        public string Status { get; set; }         // PENDING/PAID/EXPIRED/FAILED/REFUNDED
        public string XenditUserId { get; set; }   // for-user-id
        public string CheckoutUrl { get; set; }
        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public DateTime UpdatedAt { get; set; } 
        public DateTime? PaidAt { get; set; }
        public DateTime? RefundedAt { get; set; }
    }
}
