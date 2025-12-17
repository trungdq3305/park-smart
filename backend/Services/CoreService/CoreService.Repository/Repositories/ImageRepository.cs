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
    public class ImageRepository : IImageRepository
    {
        private readonly IMongoCollection<Image> _collection;

        public ImageRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<Image>("Image");

            // Index: owner.type + owner.id (để truy vấn nhanh)
            var idx = Builders<Image>.IndexKeys
                .Ascending(x => x.Owner.Type)
                .Ascending(x => x.Owner.Id);
            _collection.Indexes.CreateOne(new CreateIndexModel<Image>(idx));

            // (tùy chọn) unique ảnh theo owner + url
            var unique = Builders<Image>.IndexKeys
                .Ascending(x => x.Owner.Type)
                .Ascending(x => x.Owner.Id)
                .Ascending(x => x.Url);
            try
            {
                _collection.Indexes.CreateOne(new CreateIndexModel<Image>(unique,
                    new CreateIndexOptions { Unique = true }));
            }
            catch { /* bỏ qua nếu đã có */ }
        }

        public async Task<Image> AddAsync(Image entity)
        {
            await _collection.InsertOneAsync(entity);
            return entity;
        }

        public Task<Image?> GetByIdAsync(string id) =>
            _collection.Find(x => x.Id == id && x.DeletedAt == null).FirstOrDefaultAsync();

        public Task<List<Image>> GetByOwnerAsync(OwnerType ownerType, string ownerId, int skip = 0, int limit = 50) =>
        _collection.Find(x => x.Owner.Type == ownerType && x.Owner.Id == ownerId && x.DeletedAt == null)
                    .Skip(skip).Limit(limit).SortByDescending(u => u.CreatedAt).ToListAsync();

        public async Task<bool> HardDeleteAsync(string id)
        {
            var res = await _collection.DeleteOneAsync(x => x.Id == id);
            return res.DeletedCount == 1;
        }

        public async Task<long> HardDeleteByOwnerAsync(OwnerType ownerType, string ownerId)
        {
            var res = await _collection.DeleteManyAsync(x => x.Owner.Type == ownerType && x.Owner.Id == ownerId);
            return res.DeletedCount;
        }

        public Task SoftDeleteAsync(string id, string actorAccountId, DateTime when)
        {
            var update = Builders<Image>.Update
                .Set(x => x.DeletedAt, when)
                .Set(x => x.DeletedBy, actorAccountId);
            return _collection.UpdateOneAsync(x => x.Id == id, update);
        }
    }
}
