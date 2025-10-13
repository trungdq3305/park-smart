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
    public class FavouriteParkingLotRepository : IFavouriteParkingLotRepository
    {
        private readonly IMongoCollection<FavouriteParkingLot> _collection;

        public FavouriteParkingLotRepository(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _collection = db.GetCollection<FavouriteParkingLot>("FavouriteParkingLot");
        }

        public async Task<IEnumerable<FavouriteParkingLot>> GetByDriverIdAsync(string driverId) => await _collection.Find(x => x.DriverId == driverId && x.DeletedAt == null).SortByDescending(x => x.CreatedAt).ToListAsync();
        public async Task<FavouriteParkingLot> FindByDriverAndParkingLotAsync(string driverId, string parkingLotId) => await _collection.Find(x => x.DriverId == driverId && x.ParkingLotId == parkingLotId && x.DeletedAt == null).FirstOrDefaultAsync();
        public Task AddAsync(FavouriteParkingLot entity) => _collection.InsertOneAsync(entity);
        public Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt)
        {
            var update = Builders<FavouriteParkingLot>.Update
                .Set(x => x.DeletedAt, deletedAt)
                .Set(x => x.DeletedBy, deletedBy);
            return _collection.UpdateOneAsync(x => x.Id == id, update);
        }
    }
}
