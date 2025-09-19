using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IFaqStatusRepository
    {
        Task<FaqStatus?> GetByNameAsync(string statusName);
    }
}
