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
    public class Account
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        [BsonRepresentation(BsonType.ObjectId)]
        public string RoleId { get; set; }

        public string PhoneNumber { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public bool IsActive { get; set; }

        public DateTime? LastLoginAt { get; set; }

        public string EmailConfirmToken { get; set; }

        public DateTime? EmailConfirmTokenExpiresAt { get; set; }

        public string PasswordResetToken { get; set; }

        public DateTime? PasswordResetTokenExpiresAt { get; set; }

        public string RefreshToken { get; set; }

        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        public string CreatedBy { get; set; }

        public string UpdatedBy { get; set; }

        public string DeletedBy { get; set; }
    }
}
