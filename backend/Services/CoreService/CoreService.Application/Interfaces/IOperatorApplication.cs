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
    public interface IOperatorApplication
    {
        Task<ApiResponse<OperatorUpdateDto>> UpdateAsync(OperatorUpdateDto dto, string accountId);
    }
}
