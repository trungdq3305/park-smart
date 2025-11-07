using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PromotionDtos
{
    public class PromotionRuleResponseDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string PromotionId { get; set; }
        public PromotionRuleType RuleType { get; set; }
        public string RuleValue { get; set; }
    }
}
