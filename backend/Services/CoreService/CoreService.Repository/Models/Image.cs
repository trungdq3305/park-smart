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
    public class Image
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public OwnerRef Owner { get; set; } = new();

        public string Url { get; set; }
        public string? Description { get; set; }
        public string? FileType { get; set; }           // ví dụ: image/jpeg
        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public string CreatedBy { get; set; } = default!;
        public DateTime? DeletedAt { get; set; }        // dùng cho soft delete (nếu cần)
        [BsonRepresentation(BsonType.ObjectId)] public string? DeletedBy { get; set; }
    }

    public class OwnerRef
    {
        [BsonRepresentation(MongoDB.Bson.BsonType.String)] // Lưu trữ enum dưới dạng chuỗi trong MongoDB
        public OwnerType Type { get; set; } = default!;
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = default!;
    }
    public enum OwnerType
    {
        ParkingSession,
        Account,
        ParkingLot,
        Report,
        PaymentRecord,
        RefundRecord
    }
}
