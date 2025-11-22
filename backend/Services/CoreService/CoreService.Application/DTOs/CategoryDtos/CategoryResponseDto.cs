using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.CategoryDtos
{
    public class CategoryResponseDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
    }
    public class ReportAccountResponseDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string Name { get; set; }
    }
}
