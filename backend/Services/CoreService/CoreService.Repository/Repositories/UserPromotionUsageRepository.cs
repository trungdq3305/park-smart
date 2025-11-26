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
    public class UserPromotionUsageRepository : IUserPromotionUsageRepository
    {
        private readonly IMongoCollection<UserPromotionUsage> _collection;

        public UserPromotionUsageRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<UserPromotionUsage>("UserPromotionUsage");
        }

        public async Task<int> CountUserUsageAsync(string userId, string promotionId)
        {
            return (int)await _collection.CountDocumentsAsync(
                x => x.AccountId == userId && x.PromotionId == promotionId
            );
        }

        public Task AddAsync(UserPromotionUsage entity)
            => _collection.InsertOneAsync(entity);
        public async Task<UserPromotionUsage> GetByEntityIdAsync(string entityId) =>
            await _collection.Find(x => x.EntityId == entityId ).FirstOrDefaultAsync();
        public Task UpdateAsync(UserPromotionUsage entity) => _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);

    }
}
