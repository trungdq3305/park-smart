using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PromotionDtos
{
    public class PromotionRuleCreateDto
    {
        [Required]
        public string PromotionId { get; set; }
        [Required]
        public PromotionRuleType RuleType { get; set; }
        [Required]
        public string RuleValue { get; set; }
    }
}
