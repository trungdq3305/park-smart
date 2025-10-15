using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.CategoryDtos
{
    public class CategoryUpdateDto
    {
        [Required]
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
    }
}
