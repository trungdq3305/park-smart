using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Interfaces
{
    public interface IImageApplication
    {
        Task<Image> UploadAsync(IFormFile file, OwnerType ownerType, string ownerId, string? description);
        Task<List<Image>> GetByOwnerAsync(OwnerType ownerType, string ownerId);
        Task<bool> DeleteAsync(string id);                 // hard delete + xóa file vật lý
    }
}
