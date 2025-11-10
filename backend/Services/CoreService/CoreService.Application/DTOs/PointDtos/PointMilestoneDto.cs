using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PointDtos
{
    public class PointMilestoneCreateDto
    {
        public string Name { get; set; }
        public decimal RequiredPoints { get; set; }
        public string Description { get; set; }
        public bool IsCredit { get; set; }
    }

    public class PointMilestoneUpdateDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public decimal RequiredPoints { get; set; }
        public string Description { get; set; }
        public bool IsCredit { get; set; }
    }

    public class PointMilestoneItemDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string Name { get; set; }
        public decimal RequiredPoints { get; set; }
        public string Description { get; set; }
        public bool IsCredit { get; set; }
    }
}
