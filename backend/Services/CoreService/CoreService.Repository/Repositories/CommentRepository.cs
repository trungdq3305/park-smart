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
    public class CommentRepository : ICommentRepository
    {
        private readonly IMongoCollection<Comment> _col;

        public CommentRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _col = db.GetCollection<Comment>("Comment");
        }

        public async Task<Comment?> GetByIdAsync(string id) =>
            await _col.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();

        public async Task<IEnumerable<Comment>> GetByTargetAsync(CommentTargetType type, string targetId) =>
            await _col.Find(x => x.TargetType == type && x.TargetId == targetId && x.DeletedAt == null)
                      .SortByDescending(u => u.CreatedAt)
                      .ToListAsync();

        public async Task AddAsync(Comment entity) => await _col.InsertOneAsync(entity);

        public async Task UpdateAsync(Comment entity) =>
            await _col.ReplaceOneAsync(x => x.Id == entity.Id, entity);

        public async Task SoftDeleteAsync(string id, string byAccountId)
        {
            var update = Builders<Comment>.Update
                .Set(x => x.DeletedAt, DateTime.UtcNow)
                .Set(x => x.DeletedBy, byAccountId);
            await _col.UpdateOneAsync(x => x.Id == id, update);
        }
    }
}
