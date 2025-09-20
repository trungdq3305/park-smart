using CoreService.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Interfaces
{
    public interface ICommentRepository
    {
        Task<Comment?> GetByIdAsync(string id);
        Task<IEnumerable<Comment>> GetByTargetAsync(CommentTargetType type, string targetId); // mới
        Task AddAsync(Comment entity);
        Task UpdateAsync(Comment entity);
        Task SoftDeleteAsync(string id, string byAccountId);
    }
}
