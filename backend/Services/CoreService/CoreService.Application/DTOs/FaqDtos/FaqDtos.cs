using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.FaqDtos
{
    public class FaqCreateDto
    {
        [Required] public string Question { get; set; }
        [Required] public string Answer { get; set; }
    }

    public class FaqUpdateDto
    {
        [Required] public string Id { get; set; }
        [Required] public string Question { get; set; }
        [Required] public string Answer { get; set; }
    }
    public class FaqRejectDto
    {
        [Required] public string Id { get; set; }
        [Required] public string RejectReason { get; set; }
    }

    public class FaqResponseDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string AccountId { get; set; }
        public string FaqStatusId { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }

        public string CreatorName { get; set; }
        public string CreatorRole { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
