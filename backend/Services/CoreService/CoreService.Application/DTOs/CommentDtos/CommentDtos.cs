using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.CommentDtos
{
    public class CommentCreateDto
    {
        [Required] public string TargetId { get; set; }            // FaqId hoặc ParkingLotId
        [Required] public string Content { get; set; }
        public string? ParentId { get; set; }                      // null = root
        public int? Star { get; set; }                             // dùng cho loại cần rating

        [Required] public string TargetType { get; set; }          // "Faq" | "ParkingLot"
    }

    public class CommentUpdateDto
    {
        [Required] public string Id { get; set; }
        [Required] public string Content { get; set; }
        public int? Star { get; set; }
    }

    public class CommentItemDto
    {
        public string Id { get; set; }
        public string TargetId { get; set; }
        public string TargetType { get; set; }
        public string? ParentId { get; set; }
        public string Content { get; set; }
        public int? Star { get; set; }

        public string AccountId { get; set; }
        public string CreatorName { get; set; }
        public string CreatorRole { get; set; }

        public DateTime CreatedAt { get; set; }
        public List<CommentItemDto> Replies { get; set; } = new();
    }
}
