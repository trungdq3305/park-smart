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
    public class Driver
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string AccountId { get; set; }

        public string FullName { get; set; }

        public bool Gender { get; set; }

        public string DrivingLicenseNumber { get; set; }

        public bool IsVerified { get; set; } = false;

        public int CreditPoint { get; set; } = 100;

        public decimal AccumulatedPoints { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        public string CreatedBy { get; set; }

        public string UpdatedBy { get; set; }

        public string DeletedBy { get; set; }
    }
}
