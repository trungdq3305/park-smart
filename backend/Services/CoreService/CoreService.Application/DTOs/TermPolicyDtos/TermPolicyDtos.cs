using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.TermPolicyDtos
{
    public class TermPolicyCreateDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string Description { get; set; }
    }

    public class TermPolicyUpdateDto
    {
        public string Id { get; set; }
        public string Title { get; set; }           // cho phép update title/content/description
        public string Content { get; set; }
        public string Description { get; set; }
    }

    public class TermPolicyResponseDto
    {
        public string Id { get; set; }
        public string CityAdminId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Description { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }
    }
}
