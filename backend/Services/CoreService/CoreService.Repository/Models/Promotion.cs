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
    public class Promotion
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Code { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        [BsonRepresentation(BsonType.String)]
        public DiscountType DiscountType { get; set; }

        [BsonRepresentation(BsonType.Decimal128)]
        public decimal DiscountValue { get; set; }

        [BsonRepresentation(BsonType.Decimal128)]
        public decimal? MaxDiscountAmount { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int TotalUsageLimit { get; set; }

        public int CurrentUsageCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        // ----- Audit Fields -----
        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string CreatedBy { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string UpdatedBy { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string DeletedBy { get; set; }
    }
    public enum DiscountType
    {
        Percentage,
        FixedAmount
    }

}
