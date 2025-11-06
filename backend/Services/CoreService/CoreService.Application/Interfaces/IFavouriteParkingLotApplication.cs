using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.FavouriteDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IFavouriteParkingLotApplication
    {
        Task<ApiResponse<FavouriteResponseDto>> CreateAsync(FavouriteCreateDto dto, string driverId);
        Task<ApiResponse<object>> DeleteAsync(string parkingLotId, string driverId);
        Task<ApiResponse<List<FavouriteResponseDto>>> GetMyFavouritesAsync(string driverId);
    }
}
