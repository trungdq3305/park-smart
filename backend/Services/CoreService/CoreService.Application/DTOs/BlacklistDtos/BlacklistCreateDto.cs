using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.BlacklistDtos
{
    public class BlacklistCreateDto
    {
        [Required]
        public string DriverId { get; set; }
        [Required]
        public string Reason { get; set; }
    }
}
