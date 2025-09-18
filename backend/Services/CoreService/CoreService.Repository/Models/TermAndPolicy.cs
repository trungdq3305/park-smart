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
    public class TermAndPolicy
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        // Liên kết Admin tạo/chỉnh
        [BsonRepresentation(BsonType.ObjectId)]
        public string CityAdminId { get; set; }

        public string Title { get; set; }           // bắt buộc
        public string Content { get; set; }         // nội dung HTML/markdown/text
        public string Description { get; set; }     // mô tả ngắn

        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }

        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }
        public string DeletedBy { get; set; }
    }
}
