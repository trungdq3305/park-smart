using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface IImageRepository
    {
        Task<Image> AddAsync(Image entity);
        Task<Image?> GetByIdAsync(string id);

        Task<List<Image>> GetByOwnerAsync(string ownerType, string ownerId, int skip = 0, int limit = 50);

        Task<bool> HardDeleteAsync(string id);                           // xóa hẳn khỏi DB
        Task<long> HardDeleteByOwnerAsync(string ownerType, string ownerId);

        Task SoftDeleteAsync(string id, string actorAccountId, DateTime when);   // nếu cần giữ lịch sử
    }
}
