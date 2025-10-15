using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.ReportDtos
{
    public class ReportProcessDto
    {
        [Required]
        public string Id { get; set; }
        [Required]
        public string Response { get; set; } // Phản hồi của Admin khi xử lý
    }
}
