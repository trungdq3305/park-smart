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
    public class ReportCategoryRepository : IReportCategoryRepository
    {
        private readonly IMongoCollection<ReportCategory> _collection;

        public ReportCategoryRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<ReportCategory>("ReportCategory");
        }

        public async Task<ReportCategory> GetByIdAsync(string id) => await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
        public async Task<IEnumerable<ReportCategory>> GetAllAsync() => await _collection.Find(_ => true).SortBy(x => x.Name).ToListAsync();
        public Task AddAsync(ReportCategory entity) => _collection.InsertOneAsync(entity);
        public Task UpdateAsync(ReportCategory entity) => _collection.ReplaceOneAsync(x => x.Id == entity.Id, entity);
        public Task DeleteAsync(string id) => _collection.DeleteOneAsync(x => x.Id == id); // Hard Delete
    }
}
