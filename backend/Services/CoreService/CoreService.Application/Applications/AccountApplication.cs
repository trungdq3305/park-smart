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

        public async Task<ApiResponse<PaginationDto<AccountDetailDto>>> GetAllAsync(int? page, int? pageSize)
        {
            var accounts = await _accountRepo.GetAllAsync();
            var result = new List<AccountDetailDto>();

            foreach (var account in accounts)
            {
                var dto = _mapper.Map<AccountDetailDto>(account);

                // Ưu tiên check Driver trước
                var driver = await _driverRepo.GetByAccountIdAsync(account.Id);
                if (driver != null)
                {
                    dto.RoleName = "Driver";
                    dto.DriverDetail = _mapper.Map<DriverDto>(driver);
                }
                else
                {
                    var op = await _operatorRepo.GetByAccountIdAsync(account.Id);
                    if (op != null)
                    {
                        dto.RoleName = "Operator";
                        dto.OperatorDetail = _mapper.Map<OperatorDto>(op);
                    }
                    else
                    {
                        var admin = await _adminRepo.GetByAccountIdAsync(account.Id);
                        if (admin != null)
                        {
                            dto.RoleName = "Admin";
                            dto.AdminDetail = _mapper.Map<AdminDto>(admin);
                        }
                        else
                        {
                            dto.RoleName = "Unknown"; // Không tìm thấy trong bảng nào
                        }
                    }
                }

                result.Add(dto);
            }

            var pagedResult = PaginationDto<AccountDetailDto>.Create(result, page, pageSize);

            return new ApiResponse<PaginationDto<AccountDetailDto>>(
                pagedResult,
                true,
                "Lấy danh sách account thành công",
                StatusCodes.Status200OK
            );
        }


        public async Task<ApiResponse<PaginationDto<AccountDetailDto>>> GetByRoleAsync(string role, int? page, int? pageSize)
        {
            var accounts = await _accountRepo.GetAllAsync();
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

    }
}
