using CoreService.Application.DTOs.CategoryDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.ReportDtos
{
    public class ReportResponseDto
    {
        public string Id { get; set; }
        public string DriverId { get; set; }
        public string OperatorId { get; set; }
        public string ParkingLotId { get; set; }
        public CategoryResponseDto Category { get; set; }
        public bool IsProcessed { get; set; } // Đổi sang boolean
        public string Reason { get; set; }
        public string Response { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; } // Thời gian xử lý
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; } // Admin xử lý
    }
}
