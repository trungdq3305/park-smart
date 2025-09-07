using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface ICityAdminRepository
    {
        Task<CityAdmin?> GetByIdAsync(string id);
        Task<IEnumerable<CityAdmin>> GetAllAsync();
        Task AddAsync(CityAdmin entity);
        Task UpdateAsync(CityAdmin entity);
        Task DeleteAsync(string id);
    }
}
