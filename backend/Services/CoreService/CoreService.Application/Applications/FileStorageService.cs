using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.Applications
{
    public interface IFileStorageService
    {
        Task<(string url, string mime)> SaveImageAsync(IFormFile file);
        Task<bool> DeletePhysicalAsync(string url);
    }

    public class FileStorageService : IFileStorageService
    {
        private readonly string _root, _requestPath;
        private readonly long _maxBytes;
        private readonly HashSet<string> _allowed;

        public FileStorageService(IConfiguration cfg)
        {
            _root = cfg["Upload:RootPath"] ?? "/app/uploads";
            _requestPath = cfg["Upload:RequestPath"] ?? "/uploads";
            _maxBytes = (long)(int.Parse(cfg["Upload:MaxSizeMB"] ?? "10") * 1024 * 1024);
            _allowed = cfg.GetSection("Upload:AllowedMime").Get<string[]>()?.ToHashSet() ?? new();
        }

        public async Task<(string url, string mime)> SaveImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) throw new("Empty file");
            if (file.Length > _maxBytes) throw new($"File too large");
            if (!_allowed.Contains(file.ContentType)) throw new($"Mime not allowed: {file.ContentType}");

            var d = DateTime.UtcNow;
            var sub = Path.Combine($"{d:yyyy}", $"{d:MM}", $"{d:dd}");
            var dir = Path.Combine(_root, sub);
            Directory.CreateDirectory(dir);

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext))
                ext = file.ContentType switch { "image/jpeg" => ".jpg", "image/png" => ".png", "image/webp" => ".webp", _ => ".bin" };

            var name = $"{Guid.NewGuid():N}{ext}";
            var full = Path.Combine(dir, name);

            await using var fs = new FileStream(full, FileMode.CreateNew);
            await file.CopyToAsync(fs);

            var url = $"{_requestPath}/{sub.Replace("\\", "/")}/{name}";
            return (url, file.ContentType);
        }

        public Task<bool> DeletePhysicalAsync(string url)
        {
            if (string.IsNullOrWhiteSpace(url) || !url.StartsWith(_requestPath)) return Task.FromResult(false);
            var rel = url[_requestPath.Length..].TrimStart('/');
            var full = Path.Combine(_root, rel);
            if (System.IO.File.Exists(full)) { System.IO.File.Delete(full); return Task.FromResult(true); }
            return Task.FromResult(false);
        }
    }

}
