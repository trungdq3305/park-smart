using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Common.Helpers;
using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IAccountApplication
    {
        Task<ApiResponse<AccountListResponseDto>> GetAllAsync(int? page, int? pageSize);
        Task<ApiResponse<PaginationDto<AccountDetailDto>>> GetByRoleAsync(string role, int? page, int? pageSize);
        Task<ApiResponse<AccountDetailDto>> GetByIdAsync(string id);
        //Task<ApiResponse<Account>> CreateAsync(Account account);
        //Task<ApiResponse<Account>> UpdateAsync(string id, Account update);
        Task<ApiResponse<string>> DeleteAsync(string id);
        Task<ApiResponse<AccountDetailDto>> GetMeAsync();
        Task<ApiResponse<AccountDetailDto>> GetByDriverIdAsync(string driverId);
        Task<ApiResponse<AccountDetailDto>> GetByOperatorIdAsync(string operatorId);
        Task<ApiResponse<AccountDetailDto>> GetByAdminIdAsync(string adminId);
    }
}
