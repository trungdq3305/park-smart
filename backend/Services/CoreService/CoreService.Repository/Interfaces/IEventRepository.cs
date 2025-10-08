using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IEventRepository
    {
        Task<Event> GetByIdAsync(string id);
        Task<IEnumerable<Event>> GetAllAsync();
        Task<IEnumerable<Event>> GetByOperatorIdAsync(string operatorId);
        Task<IEnumerable<Event>> GetUpcomingEventsAsync();
        Task AddAsync(Event entity);
        Task UpdateAsync(Event entity);
        Task SoftDeleteAsync(string id, string deletedBy, DateTime deletedAt);
    }
}
