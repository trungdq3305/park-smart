using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AccountDtos
{
    public class OperatorUpdateDto
    {
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0")]
        public string PhoneNumber { get; set; }

        public string FullName { get; set; }

        public string WardId { get; set; } = default!;

        public string FullAddress { get; set; }

        //public string TaxCode { get; set; }

        public string CompanyName { get; set; }

        [EmailAddress(ErrorMessage = "Contact email không hợp lệ")]
        public string ContactEmail { get; set; }
    }
}
