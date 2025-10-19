using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.BlacklistDtos
{
    public class BlacklistUpdateDto
    {
        [Required]
        public string Id { get; set; }
        [Required]
        public string Reason { get; set; }
    }
}
