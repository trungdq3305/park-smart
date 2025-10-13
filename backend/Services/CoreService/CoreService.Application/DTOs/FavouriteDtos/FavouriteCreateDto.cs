using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.FavouriteDtos
{
    public class FavouriteCreateDto
    {
        [Required]
        public string ParkingLotId { get; set; }
    }
}
