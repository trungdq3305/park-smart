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
    public class FaqStatusRepository : IFaqStatusRepository
    {
        private readonly IMongoCollection<FaqStatus> _collection;

        public FaqStatusRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _collection = database.GetCollection<FaqStatus>("FaqStatus");
        }

        public async Task<IEnumerable<FaqStatus>> GetAllAsync() =>
            await _collection.Find(x => x.DeletedAt == null).ToListAsync();

        public async Task<FaqStatus?> GetByIdAsync(string id) =>
            await _collection.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<FaqStatus?> GetByNameAsync(string statusName) =>
            await _collection.Find(x => x.StatusName == statusName && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task AddAsync(FaqStatus entity) =>
            await _collection.InsertOneAsync(entity);

        public async Task UpdateAsync(FaqStatus entity) =>
            await _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public async Task DeleteAsync(string id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                entity.DeletedAt = TimeConverter.ToVietnamTime(DateTime.UtcNow);
                await UpdateAsync(entity);
            }
        }
    }
}
