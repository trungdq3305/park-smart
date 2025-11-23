using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PromotionDtos
{
    public class PromotionCalculateRequestDto
    {
        public string PromotionCode { get; set; }
        public decimal OriginalAmount { get; set; }
        public string AccountId { get; set; }
        public string EntiTyId { get; set; }
    }

    public class PromotionCalculateResponseDto
    {
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
    }
}
