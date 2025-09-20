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
    public enum CommentTargetType
    {
        ParkingLot = 1,
        Faq = 2
    }

    public class Comment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        // ĐÍCH BÌNH LUẬN
        public CommentTargetType TargetType { get; set; }

        // Id của đối tượng đích (ParkingLotId hoặc FaqId)
        [BsonRepresentation(BsonType.ObjectId)]
        public string TargetId { get; set; }

        // người tạo bình luận (AccountId)
        [BsonRepresentation(BsonType.ObjectId)]
        public string AccountId { get; set; }

        // reply
        [BsonRepresentation(BsonType.ObjectId)]
        public string? ParentId { get; set; }

        public string Content { get; set; }
        public int? Star { get; set; } // thường áp cho root của ParkingLot; với FAQ tuỳ bạn dùng/không

        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string CreatedBy { get; set; }     // = AccountId
        public string? UpdatedBy { get; set; }
        public string? DeletedBy { get; set; }
    }
}
