using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PromotionDtos
{
    public class PromotionCreateDto
    {
        [Required(ErrorMessage = "Mã khuyến mãi không được để trống")]
        public string Code { get; set; }

        [Required(ErrorMessage = "Tên khuyến mãi không được để trống")]
        public string Name { get; set; }

        public string Description { get; set; }

        [Required]
        public DiscountType DiscountType { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá trị giảm giá phải lớn hơn 0")]
        public decimal DiscountValue { get; set; }

        public decimal? MaxDiscountAmount { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Giới hạn sử dụng phải lớn hơn 0")]
        public int TotalUsageLimit { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
