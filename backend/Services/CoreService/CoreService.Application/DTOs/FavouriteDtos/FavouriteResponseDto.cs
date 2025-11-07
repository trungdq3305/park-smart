using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.FavouriteDtos
{
    public class FavouriteResponseDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }
        public string ParkingLotId { get; set; }
        public string DriverId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
