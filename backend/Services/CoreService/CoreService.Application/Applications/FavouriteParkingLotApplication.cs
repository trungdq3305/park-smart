using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.FavouriteDtos;
using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class FavouriteParkingLotApplication : IFavouriteParkingLotApplication
    {
        private readonly IFavouriteParkingLotRepository _repo;
        public FavouriteParkingLotApplication(IFavouriteParkingLotRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<FavouriteResponseDto>> CreateAsync(FavouriteCreateDto dto, string driverId)
        {
            var existing = await _repo.FindByDriverAndParkingLotAsync(driverId, dto.ParkingLotId);
            if (existing != null)
                throw new ApiException("Bãi đỗ này đã có trong danh sách yêu thích của bạn", StatusCodes.Status409Conflict);

            var entity = new FavouriteParkingLot
            {
                DriverId = driverId,
                ParkingLotId = dto.ParkingLotId,
                CreatedBy = driverId
            };
            await _repo.AddAsync(entity);
            return new ApiResponse<FavouriteResponseDto>(Map(entity), true, "Thêm vào danh sách yêu thích thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<object>> DeleteAsync(string parkingLotId, string driverId)
        {
            var entity = await _repo.FindByDriverAndParkingLotAsync(driverId, parkingLotId) ?? throw new ApiException("Không tìm thấy bãi đỗ này trong danh sách yêu thích", StatusCodes.Status404NotFound);
            await _repo.SoftDeleteAsync(entity.Id, driverId, TimeConverter.ToVietnamTime(DateTime.UtcNow));
            return new ApiResponse<object>(null, true, "Xóa khỏi danh sách yêu thích thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<List<FavouriteResponseDto>>> GetMyFavouritesAsync(string driverId)
        {
            var items = await _repo.GetByDriverIdAsync(driverId);
            if (items == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var list = items.Select(Map).ToList();
            return new ApiResponse<List<FavouriteResponseDto>>(list, true, "OK", StatusCodes.Status200OK);
        }

        private static FavouriteResponseDto Map(FavouriteParkingLot x) => new()
        {
            Id = x.Id,
            DriverId = x.DriverId,
            ParkingLotId = x.ParkingLotId,
            CreatedAt = x.CreatedAt
        };
    }
}
