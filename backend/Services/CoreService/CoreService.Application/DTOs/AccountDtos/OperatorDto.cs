using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public class OperatorDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string AccountId { get; set; }
        public string AddressId { get; set; }
        public string FullName { get; set; }
        public string TaxCode { get; set; }
        public string CompanyName { get; set; }
        public string ContactEmail { get; set; }
        public bool IsVerified { get; set; }
    }
}
