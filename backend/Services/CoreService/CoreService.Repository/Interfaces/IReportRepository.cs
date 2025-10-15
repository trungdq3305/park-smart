using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IReportRepository
    {
        Task<Report> GetByIdAsync(string id);
        Task<IEnumerable<Report>> GetAllAsync();
        Task<IEnumerable<Report>> GetByCreatorIdAsync(string creatorId);
        Task AddAsync(Report entity);
        Task UpdateAsync(Report entity);
    }
}
