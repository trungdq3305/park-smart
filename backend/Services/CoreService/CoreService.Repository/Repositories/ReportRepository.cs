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
    public class ReportRepository : IReportRepository
    {
        private readonly IMongoCollection<Report> _collection;
        public ReportRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<Report>("Report");
        }

        public async Task<Report> GetByIdAsync(string id) => await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<IEnumerable<Report>> GetAllAsync() => await _collection.Find(_ => true).SortByDescending(x => x.CreatedAt).ToListAsync();
        public async Task<IEnumerable<Report>> GetByCreatorIdAsync(string creatorId) => await _collection.Find(x => x.CreatedBy == creatorId).SortByDescending(x => x.CreatedAt).ToListAsync();
        public Task AddAsync(Report entity) => _collection.InsertOneAsync(entity);
        public Task UpdateAsync(Report entity) => _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);
    }
}
