using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
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
        private readonly Common.Helpers.JwtTokenHelper _jwtHelper;
        private readonly IDriverRepository _driverRepo;
        private readonly IParkingLotOperatorRepository _opRepo;
        private readonly ICityAdminRepository _adminRepo;
        public AuthApplication(IAccountRepository userRepo, Common.Helpers.JwtTokenHelper jwtHelper, IEmailApplication emailApplication, IDriverRepository driverRepo, IParkingLotOperatorRepository opRepo, ICityAdminRepository adminRepo)
        {
            _accountRepo = userRepo;
            _jwtHelper = jwtHelper;
            _emailApplication = emailApplication;
            _driverRepo = driverRepo;
            _opRepo = opRepo;
            _adminRepo = adminRepo;
        }

        public async Task<ApiResponse<string>> LoginAsync(LoginRequest request)
        {
            var account = await _accountRepo.GetByEmailAsync(request.Email);
            if (account == null || !VerifyPasswordHash(request.Password, account.Password))
            {
                throw new ApiException("Thông tin đăng nhập không hợp lệ", StatusCodes.Status401Unauthorized);
            }

            var activedAccount = await _accountRepo.GetActivedByEmailAsync(request.Email);
            if (activedAccount == null)
            {
                throw new ApiException("Tài khoản chưa được xác thực, vui lòng kiểm tra email", StatusCodes.Status401Unauthorized);
            }

            var token = _jwtHelper.GenerateToken(account);

            account.LastLoginAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            account.RefreshToken = token;

            await _accountRepo.UpdateAsync(account);
            return new ApiResponse<string>(
                data: token,
                success: true,
                message: "Đăng nhập thành công",
                statusCode: StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> DriverRegisterAsync(DriverRegisterRequest request)
        {
            var existingUser = await _accountRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new ApiException("Email đã tồn tại hoặc chưa xác nhận, vui lòng kiểm tra email", StatusCodes.Status400BadRequest);
            }

            var existingphoneUser = await _accountRepo.GetByPhoneAsync(request.PhoneNumber);
            if (existingphoneUser != null)
            {
                throw new ApiException("Số điện thoại đã được sử dụng", StatusCodes.Status400BadRequest);
            }

            var acc = new Account
            {
                Id = null,
                Email = request.Email,
                Password = HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                RoleId = "68bee20c00a9410adb97d3a1",
                IsActive = false
            };

            

            var confirmToken = Guid.NewGuid().ToString("N");
            acc.EmailConfirmToken = confirmToken;
            acc.EmailConfirmTokenExpiresAt = TimeConverter.ToVietnamTime(DateTime.UtcNow).AddHours(1);

            await _accountRepo.AddAsync(acc);

            var driver = new Driver
            {
                Id = null,
                FullName = request.FullName,
                Gender = request.Gender,
                AccountId = acc.Id,
            };
            await _driverRepo.AddAsync(driver);

            var confirmUrl = $"http://localhost:3000/api/auth/confirm?token={confirmToken}";
            await _emailApplication.SendEmailConfirmationAsync(acc.Email, confirmUrl);

            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Đăng ký thành công, vui lòng kiểm tra Email",
                statusCode: StatusCodes.Status200OK
            );
        }
        public async Task<ApiResponse<string>> OperatorRegisterAsync(OperatorRegisterRequest request)
        {
            var existingUser = await _accountRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new ApiException("Email đã tồn tại hoặc chưa được duyệt", StatusCodes.Status400BadRequest);
            }

            var existingphoneUser = await _accountRepo.GetByPhoneAsync(request.PhoneNumber);
            if (existingphoneUser != null)
            {
                throw new ApiException("Số điện thoại đã được sử dụng", StatusCodes.Status400BadRequest);
            }

            var acc = new Account
            {
                Id = null,
                Email = request.Email,
                Password = HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                RoleId = "68bee1f500a9410adb97d3a0",
                IsActive = false
            };

            await _accountRepo.AddAsync(acc);

            var op = new ParkingLotOperator
            {
                Id = null,
                FullName = request.FullName,
                TaxCode = request.TaxCode,
                CompanyName = request.CompanyName,
                ContactEmail = request.ContactEmail,
                //Address = request.Address,
                AccountId = acc.Id,
            };

            await _opRepo.AddAsync(op);


            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Đăng ký thành công, xin chờ Admin duyệt tài khoản",
                statusCode: StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> CreateAdminAsync(CreateAdminRequest request)
        {
            var existingUser = await _accountRepo.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new ApiException("Email đã tồn tại", StatusCodes.Status400BadRequest);
            }

            var existingphoneUser = await _accountRepo.GetByPhoneAsync(request.PhoneNumber);
            if (existingphoneUser != null)
            {
                throw new ApiException("Số điện thoại đã được sử dụng", StatusCodes.Status400BadRequest);
            }

            var acc = new Account
            {
                Id = null,
                Email = request.Email,
                Password = HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                RoleId = "68bee1c000a9410adb97d39f",
                IsActive = true
            };

            await _accountRepo.AddAsync(acc);

            var admin = new CityAdmin
            {
                Id = null,
                FullName = request.FullName,
                Department = request.Department,
                Position = request.Position,
                AccountId = acc.Id,
            };

            await _adminRepo.AddAsync(admin);


            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Tạo mới thành công",
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
            account.EmailConfirmToken = null;
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
            var confirmLink = $"http://localhost:3000/api/auth/confirm?token={confirmToken}";

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
        public async Task<ApiResponse<string>> ConfirmOperatorAsync(string id)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
            {
                throw new ApiException("Tài khoản không tồn tại", StatusCodes.Status400BadRequest);
            }

            if (account.IsActive == true)
            {
                throw new ApiException("Tài khoản đã xác nhận", StatusCodes.Status400BadRequest);
            }

            account.IsActive = true;
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            await _accountRepo.UpdateAsync(account);

            return new ApiResponse<string>(
                null,
                true,
                "Operator đã được xác nhận thành công.",
                StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> ForgotPasswordAsync(string email)
        {
            var account = await _accountRepo.GetByEmailAsync(email);
            if (account == null)
            {
                throw new ApiException("Email không tồn tại", StatusCodes.Status404NotFound);
            }

            if (!account.IsActive)
            {
                throw new ApiException("Tài khoản chưa được xác nhận", StatusCodes.Status400BadRequest);
            }

            // Tạo token
            var resetToken = Guid.NewGuid().ToString("N");
            account.PasswordResetToken = resetToken;
            account.PasswordResetTokenExpiresAt = TimeConverter.ToVietnamTime(DateTime.UtcNow).AddHours(1);
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            await _accountRepo.UpdateAsync(account);

            var resetUrl = $"http://localhost:3000/auth/confirm-forgot?token={resetToken}";
            await _emailApplication.SendPasswordResetAsync(account.Email, resetUrl);

            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.",
                statusCode: StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> ConfirmForgotAsync(ConfirmForgotRequest request)
        {
            var account = await _accountRepo.GetByPasswordResetTokenAsync(request.Token);
            if (account == null)
            {
                throw new ApiException("Token không hợp lệ", StatusCodes.Status400BadRequest);
            }

            if (account.PasswordResetTokenExpiresAt < TimeConverter.ToVietnamTime(DateTime.UtcNow))
            {
                throw new ApiException("Token đã hết hạn", StatusCodes.Status400BadRequest);
            }

            account.Password = HashPassword(request.NewPassword);
            account.PasswordResetToken = null;
            account.PasswordResetTokenExpiresAt = null;
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            await _accountRepo.UpdateAsync(account);

            await _emailApplication.SendPasswordChangeConfirmationAsync(account.Email, "http://localhost:3000/login");

            return new ApiResponse<string>(
                null,
                true,
                "Mật khẩu đã được thay đổi thành công.",
                StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> HandleGoogleLoginAsync(string email, string name)
        {
            var account = await _accountRepo.GetByEmailAsync(email);
            if (account == null)
            {
                account = new Account
                {
                    Id = null,
                    Email = email,
                    Password = HashPassword(Guid.NewGuid().ToString()),
                    PhoneNumber = null,
                    RoleId = "68bee20c00a9410adb97d3a1",
                    IsActive = true,
                    CreatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow),
                    UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow)
                };
                await _accountRepo.AddAsync(account);

                var driver = new Driver
                {
                    Id = null,
                    FullName = name,
                    Gender = false,
                    AccountId = account.Id
                };
                await _driverRepo.AddAsync(driver);
            }
            else if (!account.IsActive)
            {
                throw new ApiException("Tài khoản chưa được xác thực", StatusCodes.Status401Unauthorized);
            }

            var token = _jwtHelper.GenerateToken(account);
            account.LastLoginAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            account.RefreshToken = token;

            await _accountRepo.UpdateAsync(account);

            return new ApiResponse<string>
            (
                data: token,
                success: true,
                message: "Đăng nhập bằng Google thành công",
                statusCode: StatusCodes.Status200OK
            );
        }
        public async Task<ApiResponse<bool>> ChangePasswordAsync(string accountId, ChangePasswordDto dto)
        {

            var account = await _accountRepo.GetByIdAsync(accountId);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            if (dto.NewPassword != dto.ConfirmPassword)
                throw new ApiException("Mật khẩu xác nhận không khớp", StatusCodes.Status400BadRequest);

            // ✅ So sánh bằng hash, không so sánh plaintext
            var oldPasswordHash = HashPassword(dto.OldPassword);
            if (account.Password != oldPasswordHash)
                throw new ApiException("Mật khẩu cũ không đúng", StatusCodes.Status400BadRequest);

            // ✅ Hash mật khẩu mới trước khi lưu
            account.Password = HashPassword(dto.NewPassword);
            account.UpdatedAt = DateTime.UtcNow;
            account.UpdatedBy = accountId;

            await _accountRepo.UpdateAsync(account);

            return new ApiResponse<bool>(
                data: true,
                success: true,
                message: "Đổi mật khẩu thành công",
                statusCode: StatusCodes.Status200OK
            );
        }
    }

}
