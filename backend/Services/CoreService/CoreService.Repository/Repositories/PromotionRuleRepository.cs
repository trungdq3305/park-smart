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
    public class PromotionRuleRepository : IPromotionRuleRepository
    {
        private readonly IMongoCollection<PromotionRule> _collection;

        public PromotionRuleRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<PromotionRule>("PromotionRule");
        }

        public async Task<PromotionRule> GetByIdAsync(string id) => await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<IEnumerable<PromotionRule>> GetByPromotionIdAsync(string promotionId) => await _collection.Find(x => x.PromotionId == promotionId).ToListAsync();
        public Task AddAsync(PromotionRule entity) => _collection.InsertOneAsync(entity);
        public Task DeleteAsync(string id) => _collection.DeleteOneAsync(x => x.Id == id);
    }
}
