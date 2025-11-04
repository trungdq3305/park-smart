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
    public class RefundRecord
    {
        [BsonId, BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string PaymentId { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string ReservationId { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string ParkingLotSessionId { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string SubscriptionId { get; set; }
        public string XenditRefundId { get; set; }
        public long Amount { get; set; }
        public string Status { get; set; }
        public string? Reason { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
    }
}
