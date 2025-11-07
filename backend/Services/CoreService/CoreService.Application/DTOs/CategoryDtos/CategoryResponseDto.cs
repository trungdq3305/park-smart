using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.CategoryDtos
{
    public class CategoryResponseDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
    }
    public class ReportAccountResponseDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }
}
