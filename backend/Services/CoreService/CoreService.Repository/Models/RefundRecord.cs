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
        public string PaymentId { get; set; }      // PaymentRecord.Id
        public string XenditRefundId { get; set; }
        public long Amount { get; set; }
        public string Status { get; set; }         // SUCCEEDED/FAILED/PENDING
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
