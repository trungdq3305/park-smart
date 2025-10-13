using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.BlacklistDtos
{
    public class BlacklistResponseDto
    {
        public string Id { get; set; }
        public string OperatorId { get; set; }
        public string DriverId { get; set; }
        public string Reason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
