using CoreService.Application.Interfaces;
using CoreService.Repository.Interfaces;
using CoreService.Repository.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public class ImageApplication : IImageApplication
    {
        private readonly IImageRepository _repo;
        private readonly IFileStorageService _storage;

        public ImageApplication(IImageRepository repo, IFileStorageService storage)
        {
            _repo = repo;
            _storage = storage;
        }

        public async Task<Image> UploadAsync(IFormFile file, string ownerType, string ownerId, string? description)
        {
            var (url, mime) = await _storage.SaveImageAsync(file);
            var entity = new Image
            {
                Owner = new OwnerRef { Type = ownerType, Id = ownerId },
                Url = url,
                FileType = mime,
                Description = description
            };
            await _repo.AddAsync(entity);
            return entity;
        }

        public Task<List<Image>> GetByOwnerAsync(string ownerType, string ownerId)
            => _repo.GetByOwnerAsync(ownerType, ownerId);

        public async Task<bool> DeleteAsync(string id)
        {
            var doc = await _repo.GetByIdAsync(id);
            if (doc is null) return false;

            await _storage.DeletePhysicalAsync(doc.Url);        // xóa file trên VPS
            return await _repo.HardDeleteAsync(id);             // xóa DB
        }
    }
}
