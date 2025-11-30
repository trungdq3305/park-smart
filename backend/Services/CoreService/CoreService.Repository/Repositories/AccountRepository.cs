using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Dotnet.Shared.Helpers;
using Dotnet.Shared.Mongo;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly IMongoCollection<Account> _users;

        public AccountRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _users = database.GetCollection<Account>("Account");
        }

        public async Task<Account?> GetByIdAsync(string id) =>
            await _users.Find(u => u.Id == id && u.DeletedAt == null).FirstOrDefaultAsync();
        public async Task<Account?> GetByEmailAsync(string email) =>
            await _users.Find(u => u.Email == email && u.DeletedAt == null).FirstOrDefaultAsync();
        public async Task<Account?> GetByPhoneAsync(string phone) =>
            await _users.Find(u => u.PhoneNumber == phone && u.DeletedAt == null).FirstOrDefaultAsync();
        public async Task<Account?> GetActivedByEmailAsync(string email) =>
            await _users.Find(u => u.Email == email && u.IsActive == true).FirstOrDefaultAsync();
        public async Task<IEnumerable<Account>> GetAllAsync() =>
            await _users.Find(u => u.DeletedAt == null).ToListAsync();

        public async Task AddAsync(Account user) =>
            await _users.InsertOneAsync(user);

        public async Task UpdateAsync(Account user) =>
            await _users.ReplaceOneAsync(u => u.Id == user.Id, user);

        public async Task DeleteAsync(string id) =>
            await _users.DeleteOneAsync(u => u.Id == id);

        public async Task<Account> GetByRefreshTokenAsync(string emailConfirmToken)
        {
            return await _users.Find(x => x.RefreshToken == emailConfirmToken).FirstOrDefaultAsync();
        }
        public async Task<Account?> GetByPasswordResetTokenAsync(string token)
        {
            return await _users.Find(x => x.PasswordResetToken == token).FirstOrDefaultAsync();
        }
        public async Task<Account?> GetByPhoneNumberAsync(string phoneNumber) =>
    await _users.Find(a => a.PhoneNumber == phoneNumber).FirstOrDefaultAsync();
        public async Task<IEnumerable<Account>> GetInactiveAccountsAsync() =>
            await _users.Find(u => u.IsActive == false && u.DeletedAt == null).ToListAsync();
        public async Task<bool> BanAccountAsync(string accountId)
        {
            var filter = Builders<Account>.Filter.Eq(a => a.Id, accountId) &
                         Builders<Account>.Filter.Eq(a => a.DeletedAt, null);

            var update = Builders<Account>.Update
                .Set(a => a.IsActive, false)
                .Set(a => a.IsBanned, true)
                .Set(a => a.UpdatedAt, TimeConverter.ToVietnamTime(DateTime.UtcNow));

            var result = await _users.UpdateOneAsync(filter, update);

            return result.IsAcknowledged && result.ModifiedCount > 0;
        }
        // Trong CoreService.Repository.Repositories/AccountRepository.cs
        public async Task<IEnumerable<Account>> GetAllBannedAccountsAsync() =>
            await _users.Find(u => u.IsBanned == true && u.DeletedAt == null).ToListAsync(); // Thêm phương thức này
    }
}
