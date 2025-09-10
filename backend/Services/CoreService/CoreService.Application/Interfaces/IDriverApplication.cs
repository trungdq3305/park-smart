using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IDriverApplication
    {
        Task<ApiResponse<Driver>> UpdateAsync(DriverUpdateDto dto, string accountId);
    }
}
