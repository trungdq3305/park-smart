using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PromotionDtos
{
    public class PromotionResponseDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DiscountType DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalUsageLimit { get; set; }
        public int CurrentUsageCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }
        public string EventId { get; set; } // Thuộc tính này đã có trong Promotion Model, nên thêm vào DTO
        public string EventTitle { get; set; }
        public List<PromotionRuleResponseDto> Rules { get; set; }
    }
}
