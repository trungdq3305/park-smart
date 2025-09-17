using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public class AdminDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string AccountId { get; set; }
        public string FullName { get; set; }
        public string Department { get; set; }
        public string Position { get; set; }
    }
}
