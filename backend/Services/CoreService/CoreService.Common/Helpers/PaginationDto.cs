using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Common.Helpers
{
    public class PaginationDto<T>
    {
        public IEnumerable<T> Data { get; private set; }
        public int TotalItems { get; private set; }
        public int PageSize { get; private set; }
        public int TotalPages { get; private set; }
        public int CurrentPage { get; private set; }

        private PaginationDto(IEnumerable<T> data, int totalItems, int currentPage, int pageSize)
        {
            TotalItems = totalItems;
            PageSize = pageSize <= 0 ? totalItems : pageSize; // nếu không nhập => lấy hết
            TotalPages = PageSize == 0 ? 1 : (int)Math.Ceiling(totalItems / (double)PageSize);
            CurrentPage = currentPage <= 0 ? 1 : currentPage;
            Data = data;

            if (CurrentPage > TotalPages && TotalPages > 0)
            {
                CurrentPage = TotalPages;
            }
        }

        public static PaginationDto<T> Create(IEnumerable<T> source, int? page, int? pageSize)
        {
            var totalItems = source.Count();

            // nếu không truyền page/pageSize => trả về tất cả
            if (!page.HasValue || !pageSize.HasValue)
            {
                return new PaginationDto<T>(source, totalItems, 1, totalItems);
            }

            var skip = (page.Value - 1) * pageSize.Value;
            var pagedData = source.Skip(skip).Take(pageSize.Value).ToList();

            return new PaginationDto<T>(pagedData, totalItems, page.Value, pageSize.Value);
        }
    }


}
