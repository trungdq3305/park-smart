using CoreService.Repository.Models;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IAccountRepository
    {
        Task<Account?> GetByIdAsync(string id);
        Task<Account?> GetByEmailAsync(string email);
        Task<Account?> GetActivedByEmailAsync(string email);
        Task<Account?> GetByPhoneAsync(string phone);
        Task<IEnumerable<Account>> GetAllAsync();
        Task<IClientSessionHandle> StartSessionAsync();

        // Cập nhật các phương thức CRUD để nhận tham số Session tùy chọn
        Task AddAsync(Account user, IClientSessionHandle session = null);
        Task UpdateAsync(Account user, IClientSessionHandle session = null);
        Task DeleteAsync(string id, IClientSessionHandle session = null);
        Task<Account> GetByRefreshTokenAsync(string emailConfirmToken);
        Task<Account?> GetByPasswordResetTokenAsync(string token);
        Task<IEnumerable<Account>> GetInactiveAccountsAsync();
        Task<Account?> GetByPhoneNumberAsync(string phoneNumber);
        Task<bool> BanAccountAsync(string accountIdy);
        Task<IEnumerable<Account>> GetAllBannedAccountsAsync(); // Thêm dòng này
        Task<long> CountActiveAccountsAsync();

        // Lấy danh sách Account được tạo trong khoảng thời gian (dùng cho phân tích role)
        Task<IEnumerable<Account>> GetAccountsCreatedInRangeAsync(DateTime startDate, DateTime endDate);

        // Lấy danh sách đăng ký theo ngày trong một khoảng thời gian (dùng cho đồ thị)
        Task<Dictionary<string, int>> GetRegistrationsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<long> CountNewAccountsSinceAsync(DateTime since);

    }
}
