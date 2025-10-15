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
    public class Report
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string DriverId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string OperatorId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string ParkingLotId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string CategoryId { get; set; }

        public bool IsProcessed { get; set; } = false; // Trạng thái: false = Chưa xử lý, true = Đã xử lý

        public string Reason { get; set; }
        public string Response { get; set; } // Phản hồi từ Admin

        // ----- Audit Fields -----
        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public DateTime? UpdatedAt { get; set; } // Thời gian xử lý
        [BsonRepresentation(BsonType.ObjectId)]
        public string CreatedBy { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string UpdatedBy { get; set; } // Admin xử lý
    }
}
