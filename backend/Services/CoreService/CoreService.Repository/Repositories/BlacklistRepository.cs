using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
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
    public class BlacklistRepository : IBlacklistRepository
    {
        private readonly IMongoCollection<Blacklist> _collection;

        public BlacklistRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<Blacklist>("Blacklist");
        }

        public async Task<Blacklist> GetByIdAsync(string id) => await _collection.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();
        public async Task<IEnumerable<Blacklist>> GetAllAsync() => await _collection.Find(x => x.DeletedAt == null).SortByDescending(x => x.CreatedAt).ToListAsync();
        public async Task<IEnumerable<Blacklist>> GetByOperatorIdAsync(string operatorId) => await _collection.Find(x => x.OperatorId == operatorId && x.DeletedAt == null).SortByDescending(x => x.CreatedAt).ToListAsync();
        public async Task<Blacklist> FindByOperatorAndDriverAsync(string operatorId, string driverId) => await _collection.Find(x => x.OperatorId == operatorId && x.DriverId == driverId && x.DeletedAt == null).FirstOrDefaultAsync();
        public Task AddAsync(Blacklist entity) => _collection.InsertOneAsync(entity);
        public Task UpdateAsync(Blacklist entity) => _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);
        public Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt)
        {
            var update = Builders<Blacklist>.Update
                .Set(x => x.DeletedAt, deletedAt)
                .Set(x => x.DeletedBy, deletedBy);
            return _collection.UpdateOneAsync(x => x.Id == id, update);
        }
    }
}
