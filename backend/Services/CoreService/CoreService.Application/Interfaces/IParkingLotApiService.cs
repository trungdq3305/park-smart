using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.DTOs.ParkingLotDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static CoreService.Application.Applications.AuthApplication;

namespace CoreService.Application.Interfaces
{
    public interface IParkingLotApiService
    {
        // Tạo Bãi đỗ xe
        Task<ApiResponse<ParkingLotRequestCreationResponse>> CreateParkingLotAsync(
        FullOperatorCreationRequest.ParkingLotCreationRequest request);
        Task DeleteParkingLotRequestAsync(string requestId);
        Task<ApiResponse<List<ParkingLotResponse>>> FindParkingLotsByOperatorIdAsync(string operatorId);
    }
}
