using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IParkingLotOperatorRepository
    {
        Task<ParkingLotOperator?> GetByIdAsync(string id);
        Task<IEnumerable<ParkingLotOperator>> GetAllAsync();
        Task AddAsync(ParkingLotOperator entity);
        Task UpdateAsync(ParkingLotOperator entity);
        Task DeleteAsync(string id);
    }
}
