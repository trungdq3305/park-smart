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
using static System.Collections.Specialized.BitVector32;

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
        private readonly IXenditPlatformService _paymentService;
        private readonly IAddressApiService _addressApiService; // Service gọi HTTP /addresses
        private readonly IParkingLotApiService _parkingLotApiService;
        private readonly ISubscriptionPlanRepository _planRepo;
        private readonly IPaymentApp _paymentApp;
        public AuthApplication(IAccountRepository userRepo, Common.Helpers.JwtTokenHelper jwtHelper, IEmailApplication emailApplication, IDriverRepository driverRepo, IParkingLotOperatorRepository opRepo, ICityAdminRepository adminRepo, IOptions<AppSecurityOptions> securityOptions, IOperatorPaymentAccountRepo operatorPaymentAccountRepo, IXenditPlatformService paymentService, IAddressApiService addressApiService, IParkingLotApiService parkingLotApiService, ISubscriptionPlanRepository planRepo, IPaymentApp paymentApp)
        {
            _accountRepo = userRepo;
            _jwtHelper = jwtHelper;
            _emailApplication = emailApplication;
            _driverRepo = driverRepo;
            _opRepo = opRepo;
            _adminRepo = adminRepo;
            _securityOptions = securityOptions;
            _operatorPaymentAccountRepo = operatorPaymentAccountRepo;
            _paymentService = paymentService;
            _addressApiService = addressApiService;
            _parkingLotApiService = parkingLotApiService;
            _planRepo = planRepo;
            _paymentApp = paymentApp;
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
            else if (account.IsBanned)
            {
                throw new ApiException("Tài khoản đã bị khóa vì sai phạm nhiều", StatusCodes.Status401Unauthorized);
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
            using var session = await _accountRepo.StartSessionAsync();
            session.StartTransaction();
            try
            {
                await _accountRepo.AddAsync(acc, session);

                // Cập nhật lại hash theo Id thật (tránh trường hợp "precreate")
                acc.EmailOtpHash = OtpHelper.ComputeHash(otp, acc.Id, pepper);
                await _accountRepo.UpdateAsync(acc, session);

                var driver = new Driver
                {
                    Id = null,
                    FullName = request.FullName,
                    Gender = request.Gender,
                    AccountId = acc.Id,
                };
                await _driverRepo.AddAsync(driver, session);

                await session.CommitTransactionAsync();
                await _emailApplication.SendEmailConfirmationCodeAsync(acc.Email, otp);

                return new ApiResponse<string>(
                    data: null,
                    success: true,
                    message: "Đăng ký thành công. Mã xác nhận đã được gửi tới Email của bạn.",
                    statusCode: StatusCodes.Status200OK
                );
            }
            catch (Exception ex)
            {
                // ROLLBACK khi có lỗi
                await session.AbortTransactionAsync();

                // Xử lý lỗi (Nếu là ApiException thì rethrow, nếu là lỗi hệ thống thì trả về 500)
                if (ex is ApiException apiEx) throw;

                // Log lỗi hệ thống không xác định
                throw new ApiException("Lỗi hệ thống: Đăng ký thất bại và đã được hoàn tác.", StatusCodes.Status500InternalServerError);
            }
        }

        public async Task<ApiResponse<string>> OperatorRegisterAndCreateParkingLotAsync(FullOperatorCreationRequest fullRequest)
        {

            var registerReq = fullRequest.RegisterRequest;
            var addressReq = fullRequest.AddressRequest;
            var parkingLotReq = fullRequest.ParkingLotRequest;
            // 1. KIỂM TRA XÁC THỰC CƠ BẢN (Không cần Rollback nếu thất bại ở đây)
            var existingUser = await _accountRepo.GetByEmailAsync(registerReq.Email);
            if (existingUser != null)
                throw new ApiException("Email đã tồn tại hoặc chưa được duyệt", StatusCodes.Status400BadRequest);

            var existingphoneUser = await _accountRepo.GetByPhoneAsync(registerReq.PhoneNumber);
            if (existingphoneUser != null)
                throw new ApiException("Số điện thoại đã được sử dụng", StatusCodes.Status400BadRequest);

            var existingPaymentOperator = await _opRepo.GetByPaymentEmailAsync(registerReq.PaymentEmail); // Giả định có _opRepo.GetByPaymentEmailAsync
            if (existingPaymentOperator != null)
                throw new ApiException("Payment Email đã được sử dụng bởi Operator khác", StatusCodes.Status400BadRequest);

            if (registerReq.IsAgreeToP != true)
                throw new ApiException("Vui lòng đồng ý Chính Sách & Điều Khoản", StatusCodes.Status400BadRequest);
            // Biến lưu trữ đối tượng/ID đã tạo thành công
            Account createdAccount = null;
            ParkingLotOperator createdOperator = null;
            string createdAddressId = null;
            string createdParkingLotRequestId = null; // <--- BIẾN MỚI

            using var session = await _accountRepo.StartSessionAsync();
            session.StartTransaction();
            try
            {
                

                // 2. TẠO ACCOUNT VÀ OPERATOR (DB)
                var acc = new Account
                {
                    Email = registerReq.Email,
                    Password = HashPassword(registerReq.Password), // Giả định có hàm này
                    PhoneNumber = registerReq.PhoneNumber,
                    RoleId = "68bee1f500a9410adb97d3a0",
                    IsActive = false,
                    IsAgreeToP = registerReq.IsAgreeToP
                };
                await _accountRepo.AddAsync(acc, session);
                createdAccount = acc; // Lưu trữ để Rollback

                var op = new ParkingLotOperator
                {
                    FullName = registerReq.FullName,
                    PaymentEmail = registerReq.PaymentEmail,
                    BussinessName = registerReq.BussinessName,
                    AccountId = acc.Id,
                };
                await _opRepo.AddAsync(op, session);
                createdOperator = op; // Lưu trữ để Rollback

                // 3. GỌI API TẠO ĐỊA CHỈ (/addresses)
                var addressCreationResponse = await _addressApiService.CreateAddressAsync(addressReq);
                // Giả định CreateAddressAsync trả về object có thuộc tính Success và Data (chứa Id)
                if (addressCreationResponse == null || !addressCreationResponse.Success)
                    throw new ApiException("Tạo địa chỉ thất bại. Vui lòng kiểm tra WardId.", StatusCodes.Status400BadRequest);

                // Giả định Response data trả về ID của Address
                // Cần thay đổi tùy theo cấu trúc Response thực tế của API
                createdAddressId = addressCreationResponse.Data._id;

                // 4. GỌI API TẠO BÃI ĐỖ XE (/parking-lots/create-parking-lot-request)
                parkingLotReq.AddressId = createdAddressId;
                parkingLotReq.ParkingLotOperatorId = createdOperator.Id;// Liên kết Address
                                                                        // Có thể cần gán thêm OperatorId/AccountId nếu API tạo bãi đỗ xe yêu cầu

                var parkingLotCreationResponse = await _parkingLotApiService.CreateParkingLotAsync(parkingLotReq);
                if (parkingLotCreationResponse == null || !parkingLotCreationResponse.Success)
                    throw new ApiException("Tạo bãi đỗ xe thất bại.", StatusCodes.Status400BadRequest);
                createdParkingLotRequestId = parkingLotCreationResponse.Data._id; // <--- LƯU TRỮ

                // 5. TẠO PAYMENT ACCOUNT VÀ XENDIT SUB-ACCOUNT (DB/Service)
                var paymentAcc = new OperatorPaymentAccount { OperatorId = op.Id, XenditUserId = null };
                await _operatorPaymentAccountRepo.AddAsync(paymentAcc, session);
                await session.CommitTransactionAsync();
                // Tạo Sub-Account Xendit và cập nhật XenditUserId vào DB
                var xenditUserId = await _paymentService.CreateSubAccountAsync(op.Id, registerReq.PaymentEmail, registerReq.BussinessName, paymentAcc.Id);

                paymentAcc.XenditUserId = xenditUserId;
                await _operatorPaymentAccountRepo.UpdateAsync(paymentAcc, session);

                
                // 6. HOÀN TẤT
                return new ApiResponse<string>(
                    data: null,
                    success: true,
                    message: "Đăng ký, tạo địa chỉ và bãi đỗ xe thành công. Xin chờ Admin duyệt.",
                    statusCode: StatusCodes.Status200OK
                );
            }
            catch (Exception ex)
            {
                // 7. THỰC HIỆN ROLLBACK KHI XẢY RA LỖI
                await PerformRollbackAsync(createdAccount, createdOperator, createdAddressId, createdParkingLotRequestId);

                // 8. TRẢ VỀ LỖI
                if (ex is ApiException apiEx)
                {
                    // Trả về lỗi đã được định nghĩa trong luồng nghiệp vụ
                    return new ApiResponse<string>(
                        data: null,
                        success: false,
                        message: $"Lỗi Đăng ký/Tạo bãi đỗ xe: {apiEx.Message}",
                        statusCode: apiEx.StatusCode
                    );
                }
                else
                {
                    // Ghi log lỗi hệ thống (rất quan trọng)
                    // _logger.LogError(ex, "Lỗi hệ thống không xác định trong quá trình đăng ký Operator.");
                    return new ApiResponse<string>(
                        data: null,
                        success: false,
                        message: "Lỗi hệ thống không xác định. Dữ liệu đã được hoàn tác.",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
                }
            }
        }
        public async Task HandleFirstMonthBilling(ParkingLotOperator o)
        {
            DateTime registrationDate = (DateTime)o.RegistrationDate;
            var currentMonth = registrationDate.Month;
            var currentYear = registrationDate.Year;

            // 1. Lấy phí từ cấu hình
            var plan = await _planRepo.GetByIdAsync(o.SubscriptionPlanId);
            var monthlyFee = plan.MonthlyFeeAmount;

            // Nếu đăng ký từ ngày 10 trở đi: MIỄN PHÍ tháng này.
            if (registrationDate.Day >= 10)
            {
                // Billing sẽ bắt đầu vào ngày 1 tháng sau bởi Scheduler.
                return;
            }

            // Nếu đăng ký trước ngày 10 (Ngày 1-9): TÍNH PHÍ TOÀN BỘ THÁNG.

            // Ngày Đáo Hạn: Ngày cuối cùng của tháng hiện tại
            var lastDayOfMonth = new DateTime(currentYear, currentMonth,
                                              DateTime.DaysInMonth(currentYear, currentMonth));

            // Tháng tính phí: Ngày 1 của tháng hiện tại
            var invoiceMonth = new DateTime(currentYear, currentMonth, 1);

            // Tạo hóa đơn chính (OperatorCharge)
            await _paymentApp.CreateSubscriptionInvoiceAsync(
                o.Id,
                monthlyFee,
                lastDayOfMonth
            );
            // Gửi thông báo hóa đơn
            // ...
        }
        private async Task PerformRollbackAsync(Account account, ParkingLotOperator op, string addressId, string parkingLotRequestId)
        {
            if (parkingLotRequestId != null)
            {
                try
                {
                    // DELETE /parking-lots/core/requests/{requestId}
                    await _parkingLotApiService.DeleteParkingLotRequestAsync(parkingLotRequestId);
                }
                catch (Exception ex)
                {
                    // Ghi log: Không thể xóa Parking Lot Request
                    // _logger.LogError(ex, $"ROLLBACK FAILED: Cannot delete Parking Lot Request {parkingLotRequestId}.");
                }
            }
            // 1. Rollback Address (Sử dụng API DELETE)
            if (addressId != null)
            {
                try
                {
                    // Gọi API DELETE /addresses/{id}
                    await _addressApiService.DeleteAddressAsync(addressId);
                }
                catch (Exception)
                {
                    // Ghi log: Không thể xóa Address (cần theo dõi)
                }
            }

            // 2. Rollback Payment Account và Xendit (Nếu có)
            if (op != null)
            {
                try
                {
                    // 2a. Tìm Payment Account dựa trên OperatorId
                    var paymentAcc = await _operatorPaymentAccountRepo.GetByOperatorAsync(op.Id);

                    if (paymentAcc != null)
                    {
                        // 2b. Gọi Service Xendit để hủy Sub-Account nếu đã tạo Xendit ID
                        if (!string.IsNullOrEmpty(paymentAcc.XenditUserId))
                        {
                            // Giả định bạn có hàm Rollback trong IXenditPlatformService
                            // await _paymentService.RollbackXenditSubAccountAsync(paymentAcc.XenditUserId); 
                        }

                        // 2c. Xóa Payment Account khỏi DB
                        await _operatorPaymentAccountRepo.DeleteAsync(paymentAcc.Id);
                    }
                }
                catch (Exception ex)
                {
                    // Ghi log: Không thể Rollback Payment/Xendit (cần theo dõi)
                    // _logger.LogError(ex, $"ROLLBACK FAILED: Cannot rollback Payment Account for Operator {op.Id}.");
                }
            }

            // 3. Rollback Operator (DB)
            if (op != null)
            {
                try
                {
                    await _opRepo.DeleteAsync(op.Id);
                }
                catch (Exception)
                {
                    // Ghi log: Không thể xóa Operator
                }
            }

            // 4. Rollback Account (DB)
            if (account != null)
            {
                try
                {
                    await _accountRepo.DeleteAsync(account.Id);
                }
                catch (Exception)
                {
                    // Ghi log: Không thể xóa Account
                }
            }
        }
        public class ParkingLotRequestCreationResponse
        {
            // Giả định API trả về ID Request trong trường "data" là Id
            public string _id { get; set; }

            // Nếu API trả về { "data": { "_id": "..." } }, bạn cần dùng thuộc tính _id
            // public string _id { get; set; } 
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
            var content = $@"
        <h3 style='color: #2e7d32; border-bottom: 2px solid #a5d6a7; pb: 10px;'>XÁC NHẬN ĐỐI TÁC THÀNH CÔNG</h3>
        <p>Chào bạn,</p>
        <p>Tài khoản <b>Parking Lot Operator</b> của bạn đã được Admin phê duyệt.</p>
        <div style='background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;'>
            <p style='margin: 5px 0;'><strong>Tài khoản:</strong> {account.Email}</p>
            <p style='margin: 5px 0;'><strong>Email nhận tiền:</strong> {operatorEntity.PaymentEmail}</p>
        </div>
        <p>Vui lòng đăng nhập vào trang quản lý để bắt đầu vận hành bãi xe:</p>
        <div style='text-align: center;'>
            <a href='https://operator.parksmart.vn' 
               style='background-color: #4caf50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;'>
               Đăng nhập ngay
            </a>
        </div>
        <p style='margin-top: 20px; font-style: italic; color: #666;'>Trân trọng, Đội ngũ ParkSmart.</p>";

            await _emailApplication.SendEmailAsync(account.Email, subject, content);
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            operatorEntity.RegistrationDate = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            operatorEntity.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
            operatorEntity.SubscriptionPlanId = "69283c6e8a0a5cd51cd5fe5f";
            await HandleFirstMonthBilling(operatorEntity);
            await _accountRepo.UpdateAsync(account);
            await _opRepo.UpdateAsync(operatorEntity);

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
            else if (account.IsBanned)
            {
                throw new ApiException("Tài khoản đã bị khóa vì sai phạm nhiều", StatusCodes.Status401Unauthorized);
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
            account.UpdatedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
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
