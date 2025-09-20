using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Dotnet.Shared.DTOs
{
    public class AddressResponseDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string FullAddress { get; set; }
        public WardDto WardId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    public class WardDto
    {
        public string Id { get; set; }
    }
    public class ApiResponseShared<T>
    {
        public List<T> Data { get; set; }
        public string Message { get; set; }
        public int StatusCode { get; set; }
        public bool Success { get; set; }
    }
}
