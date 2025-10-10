using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.EventDtos
{
    public class EventCreateDto
    {
        public string OperatorId { get; set; } // Operator tự tạo hoặc Admin gán
        public string ParkingLotId { get; set; }
        [Required]
        public string Title { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        public string Location { get; set; }
        public bool IncludedPromotions { get; set; } = false;
    }
}
