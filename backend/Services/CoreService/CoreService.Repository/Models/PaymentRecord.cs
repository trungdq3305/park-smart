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
        [BsonRepresentation(BsonType.String)] // Lưu Enum dưới dạng String trong MongoDB
        public PaymentType PaymentType { get; set; }

        // --- CÁC TRƯỜNG ĐỊNH DANH ĐỐI TƯỢNG (Chỉ một trong 3 trường này được điền) ---

        [BsonRepresentation(BsonType.ObjectId)]
        public string? ReservationId { get; set; }  // ID Đặt trước (Optional)

        [BsonRepresentation(BsonType.ObjectId)]
        public string? SubscriptionId { get; set; } // ID Đăng ký (Optional)

        [BsonRepresentation(BsonType.ObjectId)]
        public string? ParkingLotSessionId { get; set; }  // R123
        [BsonRepresentation(BsonType.ObjectId)]
        public string OperatorId { get; set; }
        public string XenditInvoiceId { get; set; }
        public string ExternalId { get; set; }     // “RES-{ReservationId}-{ts}”
        public long Amount { get; set; }           // VND
        public string Currency { get; set; } = "VND";
        public string Status { get; set; }         // PENDING/PAID/EXPIRED/FAILED/REFUNDED
        public string XenditUserId { get; set; }   // for-user-id
        public string CheckoutUrl { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public DateTime UpdatedAt { get; set; } 
        public DateTime? PaidAt { get; set; }
        public DateTime? RefundedAt { get; set; }
    }
    public enum PaymentType
    {
        [BsonElement("RES")]
        Reservation, // Đặt trước

        [BsonElement("SUB")]
        Subscription, // Đăng ký

        [BsonElement("SES")]
        ParkingLotSession, // Phiên đỗ xe

        [BsonElement("OPR")]
        OperatorCharge // Phí nhà điều hành
    }
}
