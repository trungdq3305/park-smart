using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.DTOs.AuthDtos;
using CoreService.Application.DTOs.EmailDtos;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
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
        private readonly IOptions<AppSecurityOptions> _securityOptions;
        private readonly IOperatorPaymentAccountRepo _operatorPaymentAccountRepo;
        public AuthApplication(IAccountRepository userRepo, Common.Helpers.JwtTokenHelper jwtHelper, IEmailApplication emailApplication, IDriverRepository driverRepo, IParkingLotOperatorRepository opRepo, ICityAdminRepository adminRepo, IOptions<AppSecurityOptions> securityOptions, IOperatorPaymentAccountRepo operatorPaymentAccountRepo)
        {
            _accountRepo = userRepo;
            _jwtHelper = jwtHelper;
            _emailApplication = emailApplication;
            _driverRepo = driverRepo;
            _opRepo = opRepo;
            _adminRepo = adminRepo;
            _securityOptions = securityOptions;
            _operatorPaymentAccountRepo = operatorPaymentAccountRepo;
        }

        public async Task<ApiResponse<string>> LoginAsync(LoginRequest request)
        {
            var account = await _accountRepo.GetByEmailAsync(request.Email);
            if (account == null || !VerifyPasswordHash(request.Password, account.Password))
            {
                throw new ApiException("Thông tin đăng nhập không hợp lệ", StatusCodes.Status401Unauthorized);
            }
            if (!account.IsActive && account.RoleId == "68bee1f500a9410adb97d3a0")
            {
                throw new ApiException("Tài khoản đang chờ được Admin xác thực ", StatusCodes.Status401Unauthorized);
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
                throw new ApiException("Email đã tồn tại hoặc chưa xác nhận, vui lòng kiểm tra email", StatusCodes.Status400BadRequest);

            var existingphoneUser = await _accountRepo.GetByPhoneAsync(request.PhoneNumber);
            if (existingphoneUser != null)
                throw new ApiException("Số điện thoại đã được sử dụng", StatusCodes.Status400BadRequest);
            if (request.IsAgreeToP != true)
                throw new ApiException("Vui lòng đồng ý Chính Sách & Diều Khoản", StatusCodes.Status400BadRequest);

            var acc = new Account
            {
                Id = null,
                Email = request.Email,
                Password = HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                RoleId = "68bee20c00a9410adb97d3a1",
                IsActive = false,
                IsAgreeToP = request.IsAgreeToP
            };

            // Tạo OTP
            var otp = OtpHelper.Generate6DigitCode();
            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            // Pepper nên lấy từ config (IOptions<AppSecurity> chẳng hạn)
            string pepper = _securityOptions.Value.EmailOtpPepper;
            // Lưu hash + TTL ngắn (vd 10 phút)
            acc.EmailOtpHash = OtpHelper.ComputeHash(otp, acc.Id ?? "precreate", pepper); // tạm thời nếu Id chưa có
            acc.EmailOtpExpiresAt = now.AddMinutes(10);
            acc.EmailOtpAttemptCount = 0;
            acc.EmailOtpLastSentAt = now;

            // Lưu account trước để có Id thật (Mongo tạo Id sau khi insert)
            await _accountRepo.AddAsync(acc);

            // Cập nhật lại hash theo Id thật (tránh trường hợp "precreate")
            acc.EmailOtpHash = OtpHelper.ComputeHash(otp, acc.Id, pepper);
            await _accountRepo.UpdateAsync(acc);

            var driver = new Driver
            {
                Id = null,
                FullName = request.FullName,
                Gender = request.Gender,
                AccountId = acc.Id,
            };
            await _driverRepo.AddAsync(driver);

            await _emailApplication.SendEmailConfirmationCodeAsync(acc.Email, otp);

            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Đăng ký thành công. Mã xác nhận đã được gửi tới Email của bạn.",
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
            if (request.IsAgreeToP != true)
                throw new ApiException("Vui lòng đồng ý Chính Sách & Diều Khoản", StatusCodes.Status400BadRequest);
            var acc = new Account
            {
                Id = null,
                Email = request.Email,
                Password = HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                RoleId = "68bee1f500a9410adb97d3a0",
                IsActive = false,
                IsAgreeToP = request.IsAgreeToP
            };

            await _accountRepo.AddAsync(acc);

            var op = new ParkingLotOperator
            {
                Id = null,
                FullName = request.FullName,
                PaymentEmail = request.PaymentEmail,
                BussinessName = request.BussinessName,
                AccountId = acc.Id,
            };

            await _opRepo.AddAsync(op);

            var e = new OperatorPaymentAccount
            {
                OperatorId = op.Id,
                XenditUserId = acc.Id,      // dùng "id" làm for-user-id cho các call sau
                CreatedAt = DateTime.UtcNow
            };

        await _operatorPaymentAccountRepo.AddAsync(e);

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

        public class ConfirmEmailByCodeRequest
        {
            public string Email { get; set; }
            public string Code { get; set; } // 6 số
        }

        public async Task<ApiResponse<string>> ConfirmEmailAsync(ConfirmEmailByCodeRequest request)
        {
            var account = await _accountRepo.GetByEmailAsync(request.Email);
            if (account == null)
                throw new ApiException("Email chưa đăng ký", StatusCodes.Status404NotFound);

            if (account.IsActive)
                return new ApiResponse<string>(null, true, "Tài khoản đã được xác nhận.", StatusCodes.Status200OK);

            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            if (account.EmailOtpExpiresAt == null || account.EmailOtpExpiresAt < now)
                throw new ApiException("Mã xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại.", StatusCodes.Status400BadRequest);

            // Chống brute force: giới hạn attempts (vd 5 lần trong 10 phút)
            if (account.EmailOtpAttemptCount >= 5)
                throw new ApiException("Bạn đã nhập sai quá số lần cho phép. Vui lòng yêu cầu gửi lại mã.", StatusCodes.Status429TooManyRequests);

            string pepper = _securityOptions.Value.EmailOtpPepper;
            var inputHash = OtpHelper.ComputeHash(request.Code ?? "", account.Id, pepper);

            // Tăng counter trước (để dù lỗi vẫn đếm) nhưng rollback nếu đúng?
            // Cách an toàn: tăng rồi nếu đúng sẽ reset về 0 khi kích hoạt.
            account.EmailOtpAttemptCount += 1;
            await _accountRepo.UpdateAsync(account);

            if (!OtpHelper.FixedTimeEquals(account.EmailOtpHash, inputHash))
                throw new ApiException("Mã xác nhận không đúng.", StatusCodes.Status400BadRequest);

            // Đúng mã: kích hoạt + dọn dẹp trường OTP (idempotent)
            account.IsActive = true;
            account.EmailOtpHash = null;
            account.EmailOtpExpiresAt = null;
            account.EmailOtpAttemptCount = 0;
            account.UpdatedAt = now;
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
                throw new ApiException("Email chưa đăng ký", StatusCodes.Status404NotFound);

            if (account.IsActive)
                throw new ApiException("Tài khoản đã được xác nhận", StatusCodes.Status400BadRequest);

            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            // Throttle: mỗi 60 giây mới được gửi lại
            if (account.EmailOtpLastSentAt != null && (now - account.EmailOtpLastSentAt.Value).TotalSeconds < 60)
                throw new ApiException("Vui lòng đợi 60 giây trước khi yêu cầu mã mới.", StatusCodes.Status429TooManyRequests);

            // Nếu mã cũ còn hạn > 2 phút, có thể reuse để tránh spam (tùy chính sách)
            bool reuse = account.EmailOtpExpiresAt != null && account.EmailOtpExpiresAt > now.AddMinutes(2);

            string otp;
            string pepper = _securityOptions.Value.EmailOtpPepper;

            if (reuse && !string.IsNullOrEmpty(account.EmailOtpHash))
            {
                // KHÔNG thể lấy lại mã thô từ hash => phải phát hành mã mới luôn.
                reuse = false;
            }

            otp = OtpHelper.Generate6DigitCode();
            account.EmailOtpHash = OtpHelper.ComputeHash(otp, account.Id, pepper);
            account.EmailOtpExpiresAt = now.AddMinutes(10);
            account.EmailOtpAttemptCount = 0; // reset đếm khi phát hành mã mới
            account.EmailOtpLastSentAt = now;
            account.UpdatedAt = now;

            await _accountRepo.UpdateAsync(account);
            await _emailApplication.SendEmailConfirmationCodeAsync(email, otp);

            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Đã gửi lại mã xác nhận. Vui lòng kiểm tra hộp thư.",
                statusCode: StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<string>> ConfirmOperatorAsync(string id)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            var operatorEntity = await _opRepo.GetByAccountIdAsync(id);
            if (account == null)
            {
                throw new ApiException("Tài khoản không tồn tại", StatusCodes.Status400BadRequest);
            }

            if (account.IsActive == true)
            {
                throw new ApiException("Tài khoản đã xác nhận", StatusCodes.Status400BadRequest);
            }

            account.IsActive = true;
            var subject = "Tài khoản ParkSmart – Tài khoản Parking Lot Operator";
            var body = $@"
        <h2>Chào mừng bạn đến với ParkSmart</h2>
        <p>Tài khoản của bạn đã được tạo Admin phê duyệt.</p>
        <p>Bạn có thể đăng nhập theo cách thông thường (email & mật khẩu), 
        qua đường dận đến trang quản lý chính thức dánh cho Operator</p>
        <p>Vui lòng kiểm tra Email {operatorEntity.PaymentEmail} bạn đã đăng ký tài khoản nhận tiền trước đó để xác nhận và sử dụng </p>
        <p>Trân trọng,<br/>ParkSmart</p>";
            await _emailApplication.SendEmailAsync(account.Email, subject, body);
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

            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            // Tạo OTP 6 số
            var otp = OtpHelper.Generate6DigitCode();
            string pepper = _securityOptions.Value.EmailOtpPepper;
            account.RequestForgot = true;
            account.PasswordResetToken = OtpHelper.ComputeHash(otp, account.Id, pepper);
            account.PasswordResetTokenExpiresAt = now.AddMinutes(10);
            account.UpdatedAt = now;

            await _accountRepo.UpdateAsync(account);

            // Gửi email OTP
            await _emailApplication.SendPasswordResetOtpAsync(account.Email, otp);

            return new ApiResponse<string>(
                data: null,
                success: true,
                message: "Mã OTP đặt lại mật khẩu đã được gửi tới Email của bạn.",
                statusCode: StatusCodes.Status200OK
            );
        }


        public async Task<ApiResponse<string>> ConfirmForgotCodeAsync(ConfirmForgotCodeRequest request)
        {
            var account = await _accountRepo.GetByEmailAsync(request.Email);
            if (account == null)
                throw new ApiException("Email không tồn tại", StatusCodes.Status404NotFound);
            if (account.RequestForgot == false)
                throw new ApiException("Bạn chưa gửi yêu cầu quên mật khẩu", StatusCodes.Status404NotFound);
            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);

            if (account.PasswordResetTokenExpiresAt == null || account.PasswordResetTokenExpiresAt < now)
                throw new ApiException("Mã OTP đã hết hạn", StatusCodes.Status400BadRequest);

            string pepper = _securityOptions.Value.EmailOtpPepper;
            var inputHash = OtpHelper.ComputeHash(request.Code, account.Id, pepper);

            if (!OtpHelper.FixedTimeEquals(account.PasswordResetToken, inputHash))
                throw new ApiException("Mã OTP không đúng", StatusCodes.Status400BadRequest);
            account.PasswordResetToken = null;
            account.PasswordResetTokenExpiresAt = null;
            account.UpdatedAt = now;

            await _accountRepo.UpdateAsync(account);

            return new ApiResponse<string>(
                null,
                true,
                "Xác nhận OTP thành công.",
                StatusCodes.Status200OK
            );
        }
        public async Task<ApiResponse<string>> ConfirmForgotPassAsync(ConfirmForgotPassRequest request)
        {
            var account = await _accountRepo.GetByEmailAsync(request.Email);
            if (account == null)
                throw new ApiException("Email không tồn tại", StatusCodes.Status404NotFound);
            if (account.RequestForgot == false)
                throw new ApiException("Bạn chưa gửi yêu cầu quên mật khẩu", StatusCodes.Status404NotFound);
            if (request.NewPassword != request.ConfirmPassword)
                throw new ApiException("Mật khẩu xác nhận không khớp", StatusCodes.Status400BadRequest);

            var now = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            if (account.PasswordResetTokenExpiresAt != null && account.PasswordResetToken != null)
                throw new ApiException("Chưa xác nhận OTP", StatusCodes.Status400BadRequest);

            // Đúng OTP → cập nhật mật khẩu
            account.Password = HashPassword(request.NewPassword);
            account.UpdatedAt = now;
            account.RequestForgot = false; // reset trạng thái

            await _accountRepo.UpdateAsync(account);

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
            var tempPassword = GenerateTempPassword(12);

            if (account == null)
            {
                account = new Account
                {
                    Id = null,
                    Email = email,
                    Password = HashPassword(tempPassword),
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

                // 2. Gửi mật khẩu tạm cho user
                await _emailApplication.SendInitialPasswordAsync(
                    email,
                    tempPassword,
                    "Đây là mật khẩu để đăng nhập vào hệ thống nếu bạn không muốn đăng nhập bằng Google. " +
                    "Hãy đổi mật khẩu ngay sau khi đăng nhập để đảm bảo an toàn."
                );
            }
            else if (!account.IsActive)
            {
                throw new ApiException("Tài khoản chưa được xác thực", StatusCodes.Status401Unauthorized);
            }

            // 3. Tạo token & cập nhật LastLogin
            var token = _jwtHelper.GenerateToken(account);
            account.LastLoginAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            account.RefreshToken = token;
            await _accountRepo.UpdateAsync(account);

            return new ApiResponse<string>(
                data: token,
                success: true,
                message: "Đăng nhập bằng Google thành công",
                statusCode: StatusCodes.Status200OK
            );
        }
        string GenerateTempPassword(int length = 12)
        {
            if (length < 8) length = 8;   // ép tối thiểu 8 ký tự

            const string upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lower = "abcdefghijklmnopqrstuvwxyz";
            const string digits = "0123456789";
            const string special = "@$!%*?&";

            var rnd = new Random();

            // mỗi nhóm 1 ký tự
            var chars = new[]
            {
        upper[rnd.Next(upper.Length)],
        lower[rnd.Next(lower.Length)],
        digits[rnd.Next(digits.Length)],
        special[rnd.Next(special.Length)]
    }.ToList();

            // còn lại lấy random từ tất cả
            string all = upper + lower + digits + special;
            for (int i = chars.Count; i < length; i++)
                chars.Add(all[rnd.Next(all.Length)]);

            // xáo trộn
            return new string(chars.OrderBy(_ => rnd.Next()).ToArray());
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
