using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class AuthApplication : IAuthApplication
    {
        private readonly IAccountRepository _accountRepo;
        private readonly IEmailApplication _emailApplication;
        private readonly JwtTokenHelper _jwtHelper;

        public AuthApplication(IAccountRepository userRepo, JwtTokenHelper jwtHelper, IEmailApplication emailApplication)
        {
            _accountRepo = userRepo;
            _jwtHelper = jwtHelper;
            _emailApplication = emailApplication;
        }

        public async Task<ApiResponse<string>> LoginAsync(LoginRequest request)
        {
            var account = await _accountRepo.GetByEmailAsync(request.Email);
            if (account == null || !VerifyPasswordHash(request.Password, account.Password))
            {
                throw new ApiException("Thông tin đăng nhập không hợp lệ", StatusCodes.Status401Unauthorized);
            }

            var token = _jwtHelper.GenerateToken(account);
            return new ApiResponse<string>(
                data: token,
                success: true,
                message: "Đăng nhập thành công",
                statusCode: StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _accountRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new ApiException("Email đã tồn tại hoặc chưa xác nhận, vui lòng kiểm tra email", StatusCodes.Status400BadRequest);
            }

            string roleId = request.Role switch
            {
                "Driver" => "68ad78d5caf7a683b6229df2",
                "Operator" => "68ad7904caf7a683b6229df3",
                "Admin" => "68ad7923caf7a683b6229df4",
                _ => null
            };

            if (roleId == null)
            {
                throw new ApiException("Role không hợp lệ", StatusCodes.Status400BadRequest);
            }

            var acc = new Account
            {
                Id = null,
                Email = request.Email,
                Password = HashPassword(request.Password),
                RoleId = roleId,
                CreatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow),
                IsActive = false
            };
            var confirmToken = Guid.NewGuid().ToString("N");
            acc.EmailConfirmToken = confirmToken;
            acc.EmailConfirmTokenExpiresAt = TimeConverter.ToVietnamTime(DateTime.UtcNow).AddHours(1);

            await _accountRepo.AddAsync(acc);

            var confirmUrl = $"http://localhost:3000//api/auth/confirm?token={confirmToken}";
            await _emailApplication.SendEmailConfirmationAsync(acc.Email, confirmUrl);

            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "User registered successfully",
                statusCode: StatusCodes.Status200OK
            );
        }


        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPasswordHash(string password, string storedHash)
        {
            return HashPassword(password) == storedHash;
        }

        public async Task<ApiResponse<string>> ConfirmEmailAsync(string token)
        {
            var account = await _accountRepo.GetByRefreshTokenAsync(token);
            if (account == null)
            {
                throw new ApiException("Token không hợp lệ", StatusCodes.Status400BadRequest);
            }

            if (account.EmailConfirmTokenExpiresAt < TimeConverter.ToVietnamTime(DateTime.UtcNow))
            {
                throw new ApiException("Token hết hạn", StatusCodes.Status400BadRequest);
            }

            account.IsActive = true;
            account.RefreshToken = null;
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            await _accountRepo.UpdateAsync(account);

            return new ApiResponse<string>(
                null,
                true,
                "Email đã được xác nhận thành công. Bây giờ bạn có thể đăng nhập.",
                StatusCodes.Status200OK
            );
        }
        public async Task<ApiResponse<string>> ResendConfirmationAsync(string email)
        {
            var account = await _accountRepo.GetByEmailAsync(email);
            if (account == null)
            {
                throw new ApiException("Email chưa đăng ký", StatusCodes.Status404NotFound);
            }

            if (account.IsActive)
            {
                throw new ApiException("Tài khoản đã được xác nhận", StatusCodes.Status400BadRequest);
            }

            // Tạo token confirm mới (có hạn 24h)
            var confirmToken = Guid.NewGuid().ToString("N");
            var confirmLink = $"http://localhost:3000//api/auth/confirm?token={confirmToken}";

            // Lưu token + expired vào account
            account.EmailConfirmToken = confirmToken; 
            account.EmailConfirmTokenExpiresAt = TimeConverter.ToVietnamTime(DateTime.UtcNow).AddHours(1);
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            await _accountRepo.UpdateAsync(account);

            // Gửi mail
            await _emailApplication.SendEmailConfirmationAsync(email, confirmLink);

            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư.",
                statusCode: StatusCodes.Status200OK
            );
        }

    }

}
