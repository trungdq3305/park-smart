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
        private readonly JwtTokenHelper _jwtHelper;

        public AuthApplication(IAccountRepository userRepo, JwtTokenHelper jwtHelper)
        {
            _accountRepo = userRepo;
            _jwtHelper = jwtHelper;
        }

        public async Task<ApiResponse<string>> LoginAsync(LoginRequest request)
        {
            var account = await _accountRepo.GetByEmailAsync(request.Email);
            if (account == null || !VerifyPasswordHash(request.Password, account.Password))
            {
                return new ApiResponse<string>(
                    data: null,
                    success: false,
                    message: "Invalid credentials",
                    statusCode: StatusCodes.Status401Unauthorized
                );
            }

            var token = _jwtHelper.GenerateToken(account);
            return new ApiResponse<string>(
                data: token,
                success: true,
                message: "Login successful",
                statusCode: StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _accountRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new ApiException("Email already exists", StatusCodes.Status400BadRequest);
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
                throw new ApiException("Invalid role", StatusCodes.Status400BadRequest);
            }

            var acc = new Account
            {
                Id = null,
                Email = request.Email,
                Password = HashPassword(request.Password),
                RoleId = roleId,
                CreatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow),
            };

            await _accountRepo.AddAsync(acc);

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
    }

}
