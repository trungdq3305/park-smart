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
    public class UserPromotionUsage
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string AccountId { get; set; }

        public string PromotionId { get; set; }

        public string EntityId { get; set; }

        public DateTime UsedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);

        [BsonRepresentation(BsonType.String)]
        public UsageStatus Status { get; set; } = UsageStatus.Used;

        public DateTime? RefundedAt { get; set; }
    }
    public enum UsageStatus
    {
        Used,
        Refunded,
        Cancelled
    }
}
