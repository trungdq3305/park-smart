using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public class AccountPhoneResponse
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string PhoneNumber { get; set; }
    }
}
