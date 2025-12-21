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
    public class FaqRepository : IFaqRepository
    {
        private readonly IMongoCollection<Faq> _col;

        public FaqRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _col = db.GetCollection<Faq>("Faq");
        }

        public async Task<Faq> GetByIdAsync(string id) =>
            await _col.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<IEnumerable<Faq>> GetAllAsync() =>
            await _col.Find(x => x.DeletedAt == null).SortByDescending(x => x.CreatedAt).ToListAsync();

        public async Task AddAsync(Faq entity) => await _col.InsertOneAsync(entity);

        public async Task UpdateAsync(Faq entity) =>
            await _col.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public async Task SoftDeleteAsync(string id, string byAccountId)
        {
            var update = Builders<Faq>.Update
                .Set(x => x.DeletedAt, TimeConverter.ToVietnamTime(DateTime.UtcNow))
                .Set(x => x.DeletedBy, byAccountId);
            await _col.UpdateOneAsync(x => x.Id == id, update);
        }
        public async Task<IEnumerable<Faq>> GetByStatusAsync(string statusId) =>
        await _col.Find(x => x.DeletedAt == null && x.FaqStatusId == statusId)
                         .SortByDescending(x => x.CreatedAt)
                         .ToListAsync();

        public async Task<IEnumerable<Faq>> GetByAccountAsync(string accountId) =>
            await _col.Find(x => x.DeletedAt == null && x.CreatedBy == accountId)
                             .SortByDescending(x => x.CreatedAt)
                             .ToListAsync();
    }
}
