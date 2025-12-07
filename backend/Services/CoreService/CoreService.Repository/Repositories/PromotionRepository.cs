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
    public class PromotionRepository : IPromotionRepository
    {
        private readonly IMongoCollection<Promotion> _collection;

        public PromotionRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<Promotion>("Promotion");
        }

        public async Task<Promotion> GetByIdAsync(string id) =>
            await _collection.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<Promotion> GetByCodeAsync(string code) =>
            await _collection.Find(x => x.Code.ToLower() == code.ToLower() && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<IEnumerable<Promotion>> GetAllAsync() =>
            await _collection.Find(x => x.DeletedAt == null).SortByDescending(x => x.CreatedAt).ToListAsync();

        public Task AddAsync(Promotion entity) => _collection.InsertOneAsync(entity);

        public Task UpdateAsync(Promotion entity) =>
            _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt)
        {
            var update = Builders<Promotion>.Update
                .Set(x => x.DeletedAt, deletedAt)
                .Set(x => x.DeletedBy, deletedBy);
            return _collection.UpdateOneAsync(x => x.Id == id, update);
        }
        public async Task<IEnumerable<Promotion>> GetByOperatorIdAsync(string operatorId) =>
        await _collection.Find(x => x.OperatorId == operatorId && x.DeletedAt == null)
            .SortByDescending(x => x.CreatedAt)
            .ToListAsync();
        public async Task<IEnumerable<Promotion>> GetByEventIdAsync(string eventId) =>
    await _collection.Find(x => x.EventId == eventId && x.DeletedAt == null)
        .SortByDescending(x => x.CreatedAt)
        .ToListAsync();
    }
}
