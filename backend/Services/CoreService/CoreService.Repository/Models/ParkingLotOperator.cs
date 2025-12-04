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
    public class ParkingLotOperator
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string AccountId { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string AddressId { get; set; }

        public string FullName { get; set; }

        public string PaymentEmail { get; set; }
        public string BussinessName { get; set; }

        public bool IsVerified { get; set; } = false;
        public DateTime? RegistrationDate { get; set; } // Ngày đăng ký
        public bool? IsSuspended { get; set; } = false; // Trạng thái bị khóa dịch vụ
        [BsonRepresentation(BsonType.ObjectId)]
        public string? SubscriptionPlanId { get; set; }

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
}
