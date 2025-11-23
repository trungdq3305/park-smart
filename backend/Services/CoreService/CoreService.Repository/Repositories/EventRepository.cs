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
    public class EventRepository : IEventRepository
    {
        private readonly IMongoCollection<Event> _collection;

        public EventRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<Event>("Event");
        }

        public async Task<Event> GetByIdAsync(string id) => await _collection.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();
        public async Task<IEnumerable<Event>> GetAllAsync() => await _collection.Find(x => x.DeletedAt == null).SortByDescending(x => x.StartDate).ToListAsync();
        public async Task<IEnumerable<Event>> GetByOperatorIdAsync(string operatorId) => await _collection.Find(x => x.OperatorId == operatorId && x.DeletedAt == null).SortByDescending(x => x.StartDate).ToListAsync();
        public async Task<IEnumerable<Event>> GetByCreatedByAsync(string accId) => await _collection.Find(x => x.CreatedBy == accId && x.DeletedAt == null).SortByDescending(x => x.StartDate).ToListAsync();
        public async Task<IEnumerable<Event>> GetUpcomingEventsAsync() => await _collection.Find(x => x.EndDate >= DateTime.UtcNow && x.DeletedAt == null).SortBy(x => x.StartDate).ToListAsync();
        public Task AddAsync(Event entity) => _collection.InsertOneAsync(entity);
        public Task UpdateAsync(Event entity) => _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);
        public Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt)
        {
            var update = Builders<Event>.Update
                .Set(x => x.DeletedAt, deletedAt)
                .Set(x => x.DeletedBy, deletedBy);
            return _collection.UpdateOneAsync(x => x.Id == id, update);
        }
    }
}
