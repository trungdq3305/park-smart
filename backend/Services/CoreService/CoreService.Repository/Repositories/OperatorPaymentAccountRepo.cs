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
    public class OperatorPaymentAccountRepo : IOperatorPaymentAccountRepo
    {
        private readonly IMongoCollection<OperatorPaymentAccount> _col;

        public OperatorPaymentAccountRepo(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _col = db.GetCollection<OperatorPaymentAccount>("OperatorPaymentAccount");

            // indexes (idempotent)
            var keys1 = Builders<OperatorPaymentAccount>.IndexKeys.Ascending(x => x.OperatorId);
            var keys2 = Builders<OperatorPaymentAccount>.IndexKeys.Ascending(x => x.XenditUserId);
            _ = _col.Indexes.CreateMany(new[]
            {
                new CreateIndexModel<OperatorPaymentAccount>(keys1, new CreateIndexOptions { Unique = true }),
                new CreateIndexModel<OperatorPaymentAccount>(keys2, new CreateIndexOptions { Unique = true })
            });
        }

        public async Task<OperatorPaymentAccount?> GetByOperatorAsync(string operatorId) =>
            await _col.Find(x => x.OperatorId == operatorId).FirstOrDefaultAsync();
        public async Task<OperatorPaymentAccount?> GetByIdAsync(string Id) =>
            await _col.Find(x => x.Id == Id).FirstOrDefaultAsync();

        public async Task<OperatorPaymentAccount?> GetByXenditUserAsync(string xenditUserId) =>
            await _col.Find(x => x.XenditUserId == xenditUserId).FirstOrDefaultAsync();

        public Task AddAsync(OperatorPaymentAccount entity) => _col.InsertOneAsync(entity);

        public Task UpdateAsync(OperatorPaymentAccount entity) =>
            _col.ReplaceOneAsync(x => x.Id == entity.Id, entity);
    }
}
