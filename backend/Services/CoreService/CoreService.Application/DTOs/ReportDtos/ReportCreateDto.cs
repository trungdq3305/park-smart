using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.ReportDtos
{
    public class ReportCreateDto
    {
        [Required]
        public string ParkingLotId { get; set; }
        [Required]
        public string CategoryId { get; set; }
        [Required]
        public string Reason { get; set; }
    }
}
