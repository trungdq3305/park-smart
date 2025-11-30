using CoreService.Application.DTOs.AccountDtos;
using CoreService.Application.DTOs.ApiResponse;
using CoreService.Application.Interfaces;
using CoreService.Common.Helpers;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class AccountApplication : IAccountApplication
    {
        private readonly IAccountRepository _accountRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IDriverRepository _driverRepo;
        private readonly IParkingLotOperatorRepository _operatorRepo;
        private readonly ICityAdminRepository _adminRepo;
        private readonly AutoMapper.IMapper _mapper;

        public AccountApplication(
            IAccountRepository accountRepo,
            IHttpContextAccessor httpContextAccessor,
            IDriverRepository driverRepo,
            IParkingLotOperatorRepository operatorRepo,
            ICityAdminRepository adminRepo,
            AutoMapper.IMapper mapper)
        {
            _accountRepo = accountRepo;
            _httpContextAccessor = httpContextAccessor;
            _driverRepo = driverRepo;
            _operatorRepo = operatorRepo;
            _adminRepo = adminRepo;
            _mapper = mapper;
        }

        public async Task<ApiResponse<AccountListResponseDto>> GetAllAsync(int? page, int? pageSize)
        {
            // 1. Lấy tất cả dữ liệu cần thiết từ database một cách đồng thời
            var accountsTask = _accountRepo.GetAllAsync();

            if (accountsTask == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var driversTask = _driverRepo.GetAllAsync(); // Giả sử bạn có phương thức GetAllAsync
            var operatorsTask = _operatorRepo.GetAllAsync(); // Giả sử bạn có phương thức GetAllAsync
            var adminsTask = _adminRepo.GetAllAsync(); // Giả sử bạn có phương thức GetAllAsync
            
            await Task.WhenAll(accountsTask, driversTask, operatorsTask, adminsTask);

            var accounts = await accountsTask;
            var drivers = await driversTask;
            var operators = await operatorsTask;
            var admins = await adminsTask;

            // 2. Tạo các Dictionary để tra cứu nhanh thông tin role theo AccountId
            var driversByAccountId = drivers.ToDictionary(d => d.AccountId);
            var operatorsByAccountId = operators.ToDictionary(o => o.AccountId);
            var adminsByAccountId = admins.ToDictionary(a => a.AccountId);

            var result = new List<AccountDetailDto>();

            // 3. Map dữ liệu mà không cần gọi database trong vòng lặp
            foreach (var account in accounts)
            {
                var dto = _mapper.Map<AccountDetailDto>(account);

                // Ưu tiên check Driver trước
                if (driversByAccountId.TryGetValue(account.Id, out var driver))
                {
                    dto.RoleName = "Driver";
                    dto.DriverDetail = _mapper.Map<DriverDto>(driver);
                }
                else if (operatorsByAccountId.TryGetValue(account.Id, out var op))
                {
                    dto.RoleName = "Operator";
                    dto.OperatorDetail = _mapper.Map<OperatorDto>(op);
                }
                else if (adminsByAccountId.TryGetValue(account.Id, out var admin))
                {
                    dto.RoleName = "Admin";
                    dto.AdminDetail = _mapper.Map<AdminDto>(admin);
                }
                else
                {
                    dto.RoleName = "Unknown"; // Không tìm thấy trong bảng nào
                }

                result.Add(dto);
            }

            // 4. Phân trang kết quả cuối cùng
            var pagedResult = PaginationDto<AccountDetailDto>.Create(result, page, pageSize);

            // 5. Tạo đối tượng response cuối cùng với các số liệu thống kê
            var responseData = new AccountListResponseDto
            {
                PagedAccounts = pagedResult,
                TotalUsers = accounts.Count(),
                TotalDrivers = drivers.Count(),
                TotalOperators = operators.Count(),
                TotalAdmins = admins.Count()
            };

            return new ApiResponse<AccountListResponseDto>(
                responseData,
                true,
                "Lấy danh sách account thành công",
                StatusCodes.Status200OK
            );
        }
        

        public async Task<ApiResponse<PaginationDto<AccountDetailDto>>> GetByRoleAsync(string role, int? page, int? pageSize)
        {
            var accounts = await _accountRepo.GetAllAsync();
            if (accounts == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            IEnumerable<AccountDetailDto> dtoList = new List<AccountDetailDto>();

            switch (role?.ToLower())
            {
                case "driver":
                    var drivers = await _driverRepo.GetAllAsync();
                    dtoList = from d in drivers
                              join a in accounts on d.AccountId equals a.Id
                              let dto = _mapper.Map<AccountDetailDto>(a)
                              select dto with
                              {
                                  RoleName = "Driver",
                                  DriverDetail = _mapper.Map<DriverDto>(d)
                              };
                    break;

                case "operator":
                    var operators = await _operatorRepo.GetAllAsync();
                    dtoList = from o in operators
                              join a in accounts on o.AccountId equals a.Id
                              let dto = _mapper.Map<AccountDetailDto>(a)
                              select dto with
                              {
                                  RoleName = "Operator",
                                  OperatorDetail = _mapper.Map<OperatorDto>(o)
                              };
                    break;

                case "admin":
                    var admins = await _adminRepo.GetAllAsync();
                    dtoList = from ad in admins
                              join a in accounts on ad.AccountId equals a.Id
                              let dto = _mapper.Map<AccountDetailDto>(a)
                              select dto with
                              {
                                  RoleName = "Admin",
                                  AdminDetail = _mapper.Map<AdminDto>(ad)
                              };
                    break;

                default:
                    throw new ApiException("Role không hợp lệ. Vui lòng chọn Driver, Operator hoặc Admin.", StatusCodes.Status400BadRequest);
            }

            var paged = PaginationDto<AccountDetailDto>.Create(dtoList, page, pageSize);

            return new ApiResponse<PaginationDto<AccountDetailDto>>(
                paged,
                true,
                $"Lấy danh sách {role} thành công",
                StatusCodes.Status200OK
            );
        }
        public async Task<ApiResponse<AccountPhoneResponse>> GetByPhoneAsync(string phone)
        {
           
            //await _accountRepo.GetByPhoneAsync(phone);

            var account = await _accountRepo.GetByPhoneAsync(phone);
            if (account == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            // 2. Kiểm tra nếu không tìm thấy tài khoản
            if (account == null)
            {
                // Trả về lỗi "Không tìm thấy" (404 Not Found)
                return new ApiResponse<AccountPhoneResponse>(
                    null,
                    false,
                    $"Không tìm thấy tài khoản với số điện thoại: {phone}.",
                    StatusCodes.Status404NotFound
                );
            }

            // 3. Chuyển đổi sang DTO và trả về thành công
            var dto = new AccountPhoneResponse
            {
                Id = account.Id,
                PhoneNumber = account.PhoneNumber
            };

            return new ApiResponse<AccountPhoneResponse>(
                dto,
                true,
                $"Tìm thấy tài khoản với số điện thoại: {phone} thành công.",
                StatusCodes.Status200OK
            );
        }
        public async Task<ApiResponse<AccountDetailDto>> GetByIdAsync(string id)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            var dto = _mapper.Map<AccountDetailDto>(account);

            // Check Driver
            var driver = await _driverRepo.GetByAccountIdAsync(account.Id);
            if (driver != null)
            {
                dto.RoleName = "Driver";
                dto.DriverDetail = _mapper.Map<DriverDto>(driver);
            }
            else
            {
                // Check Operator
                var op = await _operatorRepo.GetByAccountIdAsync(account.Id);
                if (op != null)
                {
                    dto.RoleName = "Operator";
                    dto.OperatorDetail = _mapper.Map<OperatorDto>(op);
                }
                else
                {
                    // Check Admin
                    var admin = await _adminRepo.GetByAccountIdAsync(account.Id);
                    if (admin != null)
                    {
                        dto.RoleName = "Admin";
                        dto.AdminDetail = _mapper.Map<AdminDto>(admin);
                    }
                    else
                    {
                        dto.RoleName = "Unknown";
                    }
                }
            }

            return new ApiResponse<AccountDetailDto>(
                dto,
                true,
                "Lấy thông tin account thành công",
                StatusCodes.Status200OK
            );
        }

        public async Task<ApiResponse<AccountDetailDto>> GetMeAsync()
        {
            var id = _httpContextAccessor.HttpContext?.User?.FindFirst("id")?.Value;
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            var dto = _mapper.Map<AccountDetailDto>(account);

            // Check Driver
            var driver = await _driverRepo.GetByAccountIdAsync(account.Id);
            if (driver != null)
            {
                dto.RoleName = "Driver";
                dto.DriverDetail = _mapper.Map<DriverDto>(driver);
            }
            else
            {
                // Check Operator
                var op = await _operatorRepo.GetByAccountIdAsync(account.Id);
                if (op != null)
                {
                    dto.RoleName = "Operator";
                    dto.OperatorDetail = _mapper.Map<OperatorDto>(op);
                }
                else
                {
                    // Check Admin
                    var admin = await _adminRepo.GetByAccountIdAsync(account.Id);
                    if (admin != null)
                    {
                        dto.RoleName = "Admin";
                        dto.AdminDetail = _mapper.Map<AdminDto>(admin);
                    }
                    else
                    {
                        dto.RoleName = "Unknown";
                    }
                }
            }

            return new ApiResponse<AccountDetailDto>(
                dto,
                true,
                "Lấy thông tin account thành công",
                StatusCodes.Status200OK
            );
        }
        public async Task<ApiResponse<AccountDetailDto>> GetByDriverIdAsync(string driverId)
        {
            var driver = await _driverRepo.GetByIdAsync(driverId);
            if (driver == null)
                throw new ApiException("Driver không tồn tại", StatusCodes.Status404NotFound);

            var account = await _accountRepo.GetByIdAsync(driver.AccountId);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            var dto = _mapper.Map<AccountDetailDto>(account);
            dto.RoleName = "Driver";
            dto.DriverDetail = _mapper.Map<DriverDto>(driver);

            return new ApiResponse<AccountDetailDto>(dto, true, "Lấy thông tin driver thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<AccountDetailDto>> GetByOperatorIdAsync(string operatorId)
        {
            var op = await _operatorRepo.GetByIdAsync(operatorId);
            if (op == null)
                throw new ApiException("Operator không tồn tại", StatusCodes.Status404NotFound);

            var account = await _accountRepo.GetByIdAsync(op.AccountId);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            var dto = _mapper.Map<AccountDetailDto>(account);
            dto.RoleName = "Operator";
            dto.OperatorDetail = _mapper.Map<OperatorDto>(op);

            return new ApiResponse<AccountDetailDto>(dto, true, "Lấy thông tin operator thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<AccountDetailDto>> GetByAdminIdAsync(string adminId)
        {
            var admin = await _adminRepo.GetByIdAsync(adminId);
            if (admin == null)
                throw new ApiException("Admin không tồn tại", StatusCodes.Status404NotFound);

            var account = await _accountRepo.GetByIdAsync(admin.AccountId);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            var dto = _mapper.Map<AccountDetailDto>(account);
            dto.RoleName = "Admin";
            dto.AdminDetail = _mapper.Map<AdminDto>(admin);

            return new ApiResponse<AccountDetailDto>(dto, true, "Lấy thông tin admin thành công", StatusCodes.Status200OK);
        }

        

        public async Task<ApiResponse<Account>> CreateAsync(Account account)
        {
            account.Id = null;
            account.CreatedAt = DateTime.UtcNow;
            account.UpdatedAt = DateTime.UtcNow;
            await _accountRepo.AddAsync(account);

            return new ApiResponse<Account>(account, true, "Tạo account thành công", StatusCodes.Status201Created);
        }

        public async Task<ApiResponse<Account>> UpdateAsync(string id, Account update)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            account.Email = update.Email ?? account.Email;
            account.PhoneNumber = update.PhoneNumber ?? account.PhoneNumber;
            account.RoleId = update.RoleId ?? account.RoleId;
            account.IsActive = update.IsActive;
            account.UpdatedAt = DateTime.UtcNow;

            await _accountRepo.UpdateAsync(account);
            return new ApiResponse<Account>(account, true, "Cập nhật account thành công", StatusCodes.Status200OK);
        }

        public async Task<ApiResponse<string>> DeleteAsync(string id)
        {
            var account = await _accountRepo.GetByIdAsync(id);
            if (account == null)
                throw new ApiException("Account không tồn tại", StatusCodes.Status404NotFound);

            await _accountRepo.DeleteAsync(id);
            return new ApiResponse<string>(null, true, "Xoá account thành công", StatusCodes.Status200OK);
        }
        public async Task<ApiResponse<PaginationDto<AccountDetailDto>>> GetInactiveOperatorsAsync(int? page, int? pageSize)
        {
            // 1. Lấy tất cả Operator và các tài khoản không hoạt động.
            // (Bạn có thể dùng _accountRepo.GetAllAsync() và lọc, nhưng GetInactiveAccountsAsync() hiệu quả hơn)
            var inactiveAccountsTask = _accountRepo.GetInactiveAccountsAsync();
            if (inactiveAccountsTask == null)
            {
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status401Unauthorized);
            }
            var operatorsTask = _operatorRepo.GetAllAsync(); // Lấy tất cả Operator để tìm AccountId tương ứng

            await Task.WhenAll(inactiveAccountsTask, operatorsTask);

            var inactiveAccounts = await inactiveAccountsTask;
            var operators = await operatorsTask;

            // 2. Tạo Dictionary để tra cứu nhanh Operator theo AccountId
            var operatorsByAccountId = operators.ToDictionary(o => o.AccountId);

            var result = new List<AccountDetailDto>();

            // 3. Lọc: Chỉ giữ lại các Account KHÔNG hoạt động VÀ là Operator
            foreach (var account in inactiveAccounts)
            {
                if (operatorsByAccountId.TryGetValue(account.Id, out var op))
                {
                    var dto = _mapper.Map<AccountDetailDto>(account);
                    dto.RoleName = "Operator";
                    dto.OperatorDetail = _mapper.Map<OperatorDto>(op);

                    result.Add(dto);
                }
            }

            // 4. Phân trang kết quả
            var pagedResult = PaginationDto<AccountDetailDto>.Create(result, page, pageSize);

            return new ApiResponse<PaginationDto<AccountDetailDto>>(
                pagedResult,
                true,
                "Lấy danh sách operator không hoạt động thành công",
                StatusCodes.Status200OK
            );
        }
        // Trong CoreService.Application.Applications/AccountApplication.cs

        // ... (các phương thức khác) ...

        public async Task<ApiResponse<PaginationDto<AccountDetailDto>>> GetAllBannedAccountsAsync(int? page, int? pageSize)
        {
            // 1. Lấy tất cả tài khoản bị cấm từ database.
            var bannedAccountsTask = _accountRepo.GetAllBannedAccountsAsync();

            // Đồng thời lấy tất cả Drivers, Operators, Admins để xác định Role
            var driversTask = _driverRepo.GetAllAsync();
            var operatorsTask = _operatorRepo.GetAllAsync();
            var adminsTask = _adminRepo.GetAllAsync();

            await Task.WhenAll(bannedAccountsTask, driversTask, operatorsTask, adminsTask);

            var bannedAccounts = await bannedAccountsTask;

            if (bannedAccounts == null || !bannedAccounts.Any())
            {
                // Trả về kết quả rỗng nếu không có tài khoản nào bị cấm, với Status 200 OK
                var emptyPagedResult = PaginationDto<AccountDetailDto>.Create(Enumerable.Empty<AccountDetailDto>(), page, pageSize);
                throw new ApiException("Danh sách hiện không có dữ liệu, vui lòng vập nhật thêm", StatusCodes.Status404NotFound);
            }

            // 2. Tạo Dictionary để tra cứu nhanh thông tin role theo AccountId
            var driversByAccountId = (await driversTask).ToDictionary(d => d.AccountId);
            var operatorsByAccountId = (await operatorsTask).ToDictionary(o => o.AccountId);
            var adminsByAccountId = (await adminsTask).ToDictionary(a => a.AccountId);

            var result = new List<AccountDetailDto>();

            // 3. Map Account bị cấm sang DTO và xác định Role
            foreach (var account in bannedAccounts)
            {
                var dto = _mapper.Map<AccountDetailDto>(account);

                // Xác định Role (Ưu tiên Driver/Operator/Admin)
                if (driversByAccountId.TryGetValue(account.Id, out var driver))
                {
                    dto.RoleName = "Driver";
                    dto.DriverDetail = _mapper.Map<DriverDto>(driver);
                }
                else if (operatorsByAccountId.TryGetValue(account.Id, out var op))
                {
                    dto.RoleName = "Operator";
                    dto.OperatorDetail = _mapper.Map<OperatorDto>(op);
                }
                else if (adminsByAccountId.TryGetValue(account.Id, out var admin))
                {
                    dto.RoleName = "Admin";
                    dto.AdminDetail = _mapper.Map<AdminDto>(admin);
                }
                else
                {
                    dto.RoleName = "Unknown"; // Không tìm thấy trong bảng vai trò nào
                }

                result.Add(dto);
            }

            // 4. Phân trang kết quả
            var pagedResult = PaginationDto<AccountDetailDto>.Create(result, page, pageSize);

            return new ApiResponse<PaginationDto<AccountDetailDto>>(
                pagedResult,
                true,
                "Lấy danh sách tài khoản bị cấm thành công",
                StatusCodes.Status200OK
            );
        }
    }
}
