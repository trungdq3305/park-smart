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
    public class PointMilestoneRepository : IPointMilestoneRepository
    {
        private readonly IMongoCollection<PointMilestone> _collection;

        public PointMilestoneRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<PointMilestone>("PointMilestone");
        }

        public async Task<PointMilestone?> GetByIdAsync(string id) =>
            await _collection.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<IEnumerable<PointMilestone>> GetAllAsync() =>
            await _collection.Find(x => x.DeletedAt == null)
                             .SortByDescending(x => x.CreatedAt).ToListAsync();

        public async Task<IEnumerable<PointMilestone>> GetAllCreditAsync() =>
            await _collection.Find(x => x.IsCredit && x.DeletedAt == null)
                             .SortByDescending(x => x.CreatedAt).ToListAsync();

        public async Task<IEnumerable<PointMilestone>> GetAllAccumulatedAsync() =>
            await _collection.Find(x => !x.IsCredit && x.DeletedAt == null)
                             .SortByDescending(x => x.CreatedAt).ToListAsync();

        public Task AddAsync(PointMilestone entity) => _collection.InsertOneAsync(entity);

        public Task UpdateAsync(PointMilestone entity) =>
            _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt)
        {
            var update = Builders<PointMilestone>.Update
                .Set(x => x.DeletedAt, deletedAt)
                .Set(x => x.DeletedBy, deletedBy);
            return _collection.UpdateOneAsync(x => x.Id == id, update);
        }
    }
}
