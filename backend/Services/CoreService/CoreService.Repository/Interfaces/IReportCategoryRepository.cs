using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IReportCategoryRepository
    {
        Task<ReportCategory> GetByIdAsync(string id);
        Task<IEnumerable<ReportCategory>> GetAllAsync();
        Task AddAsync(ReportCategory entity);
        Task UpdateAsync(ReportCategory entity);
        Task DeleteAsync(string id); // Đổi thành Hard Delete
    }
}
