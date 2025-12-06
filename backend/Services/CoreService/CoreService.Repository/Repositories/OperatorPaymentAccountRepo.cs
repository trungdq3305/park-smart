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

        public async Task AddAsync(OperatorPaymentAccount entity, IClientSessionHandle session = null)
        {
            if (session != null)
            {
                await _col.InsertOneAsync(session, entity);
            }
            else
            {
                await _col.InsertOneAsync(entity);
            }
        }

        public async Task UpdateAsync(OperatorPaymentAccount entity, IClientSessionHandle session = null)
        {
            if (session != null)
            {
                await _col.ReplaceOneAsync(session, u => u.Id == entity.Id, entity);
            }
            else
            {
                await _col.ReplaceOneAsync(u => u.Id == entity.Id, entity);
            }
        }
        public async Task DeleteAsync(string id) =>
            await _col.DeleteOneAsync(u => u.Id == id);
    }
}
