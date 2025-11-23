using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.PaymentDtos
{
    // Trong CoreService.Application.DTOs.DashboardDtos
    public class OperatorDashboardRequest
    {
        public string? OperatorId { get; set; } // Dùng cho Admin lọc hoặc Operator tự lấy
        public string? Status { get; set; }
        public string? PaymentType { get; set; } // RES, SUB, SES, OPR
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
