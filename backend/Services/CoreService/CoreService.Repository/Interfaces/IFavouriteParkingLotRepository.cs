using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IFavouriteParkingLotRepository
    {
        Task<IEnumerable<FavouriteParkingLot>> GetByDriverIdAsync(string driverId);
        Task<FavouriteParkingLot> FindByDriverAndParkingLotAsync(string driverId, string parkingLotId);
        Task AddAsync(FavouriteParkingLot entity);
        Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt);
    }
}
