using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PromotionDtos
{
    public class PromotionUpdateDto
    {
        [Required]
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? TotalUsageLimit { get; set; }
        public bool? IsActive { get; set; }
    }
}
