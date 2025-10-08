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

        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string PromotionId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string ReservationId { get; set; }

        public DateTime UsedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
    }
}
