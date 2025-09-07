using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Shared.Mongo;

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
            await _users.Find(u => u.Id == id).FirstOrDefaultAsync();

        public async Task<Account?> GetByEmailAsync(string email) =>
            await _users.Find(u => u.Email == email).FirstOrDefaultAsync();

        public async Task<IEnumerable<Account>> GetAllAsync() =>
            await _users.Find(_ => true).ToListAsync();

        public async Task AddAsync(Account user) =>
            await _users.InsertOneAsync(user);

        public async Task UpdateAsync(Account user) =>
            await _users.ReplaceOneAsync(u => u.Id == user.Id, user);

        public async Task DeleteAsync(string id) =>
            await _users.DeleteOneAsync(u => u.Id == id);
    }
}
