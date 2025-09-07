using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Shared.Mongo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Repositories
{
    public class CityAdminRepository : ICityAdminRepository
    {
        private readonly IMongoCollection<CityAdmin> _collection;

        public CityAdminRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _collection = database.GetCollection<CityAdmin>("CityAdmin");
        }

        public async Task<CityAdmin?> GetByIdAsync(string id) =>
            await _collection.Find(e => e.Id == id).FirstOrDefaultAsync();

        public async Task<IEnumerable<CityAdmin>> GetAllAsync() =>
            await _collection.Find(_ => true).ToListAsync();

        public async Task AddAsync(CityAdmin entity) =>
            await _collection.InsertOneAsync(entity);

        public async Task UpdateAsync(CityAdmin entity) =>
            await _collection.ReplaceOneAsync(e => e.Id == entity.Id, entity);

        public async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(e => e.Id == id);
    }
}
