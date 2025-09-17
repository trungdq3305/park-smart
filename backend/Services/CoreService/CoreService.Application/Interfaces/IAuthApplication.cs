using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static CoreService.Application.Applications.AuthApplication;

namespace CoreService.Application.Interfaces
{
    public interface IAuthApplication
    {
        Task<ApiResponse<string>> LoginAsync(LoginRequest request);
        Task<ApiResponse<string>> DriverRegisterAsync(DriverRegisterRequest request);
        Task<ApiResponse<string>> OperatorRegisterAsync(OperatorRegisterRequest request);
        Task<ApiResponse<string>> CreateAdminAsync(CreateAdminRequest request);
        Task<ApiResponse<string>> ConfirmEmailAsync(ConfirmEmailByCodeRequest request);
        Task<ApiResponse<string>> ResendConfirmationAsync(string email);
        Task<ApiResponse<string>> ConfirmOperatorAsync(string id);
        Task<ApiResponse<string>> ForgotPasswordAsync(string email);
        Task<ApiResponse<string>> ConfirmForgotAsync(ConfirmForgotRequest request);
        Task<ApiResponse<string>> HandleGoogleLoginAsync(string email, string name);
        Task<ApiResponse<bool>> ChangePasswordAsync(string accountId, ChangePasswordDto dto);
    }
}
