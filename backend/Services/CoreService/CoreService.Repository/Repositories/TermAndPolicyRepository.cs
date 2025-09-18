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
    public class TermAndPolicyRepository : ITermAndPolicyRepository
    {
        private readonly IMongoCollection<TermAndPolicy> _collection;

        public TermAndPolicyRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<TermAndPolicy>("TermAndPolicy");
        }

        public async Task<TermAndPolicy?> GetByIdAsync(string id) =>
            await _collection.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<IEnumerable<TermAndPolicy>> GetAllAsync() =>
            await _collection.Find(x => x.DeletedAt == null).SortByDescending(x => x.CreatedAt).ToListAsync();

        public async Task<IEnumerable<TermAndPolicy>> GetByAdminIdAsync(string cityAdminId) =>
            await _collection.Find(x => x.CityAdminId == cityAdminId && x.DeletedAt == null)
                             .SortByDescending(x => x.CreatedAt).ToListAsync();

        public Task AddAsync(TermAndPolicy entity) => _collection.InsertOneAsync(entity);

        public Task UpdateAsync(TermAndPolicy entity) =>
            _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt)
        {
            var update = Builders<TermAndPolicy>.Update
                .Set(x => x.DeletedAt, deletedAt)
                .Set(x => x.DeletedBy, deletedBy);
            return _collection.UpdateOneAsync(x => x.Id == id, update);
        }
    }
}
