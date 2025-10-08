using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Models
{
    public class PromotionRule
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string PromotionId { get; set; }

        [BsonRepresentation(BsonType.String)]
        public PromotionRuleType RuleType { get; set; }

        public string RuleValue { get; set; }
    }
    public enum PromotionRuleType
    {
        MinBookingValue,
        ParkingLot,
        User,
        VehicleType,
        PaymentMethod
    }
}
