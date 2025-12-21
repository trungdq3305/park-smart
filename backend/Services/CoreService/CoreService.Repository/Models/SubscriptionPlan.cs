using Dotnet.Shared.Helpers;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Repository.Models
{
    public class SubscriptionPlan
    {
        [BsonId, BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        // Định danh gói phí
        public string Name { get; set; } = "Standard Monthly Fee";
        public string Description { get; set; }

        // 1. Cấu hình Phí chính
        public long MonthlyFeeAmount { get; set; } = 100000;// Số tiền phí dịch vụ hàng tháng cố định (VND)

        // 2. Cấu hình Quy tắc Tính phí
        public int BillingDayOfMonth { get; set; } = 1; // Ngày cố định tạo hóa đơn (1-28).

        // 3. Cấu hình Ân hạn và Phạt
        public int GracePeriodDays { get; set; } = 30; // Số ngày tối đa để thanh toán (VD: 30 ngày = đến cuối tháng)

        // Phí phạt (sẽ được tạo thành Hóa đơn PenaltyCharge)
        public long PenaltyFeeAmount { get; set; } = 0; // Số tiền phạt cố định hoặc tính theo %

        // Số tháng quá hạn tối đa trước khi khóa
        public int MaxOverdueMonthsBeforeSuspension { get; set; } = 2; // Ví dụ: 2 tháng (hết tháng T+2)

        // 4. Các trường quản lý
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = TimeConverter.ToVietnamTime(DateTime.UtcNow);
        public DateTime UpdatedAt { get; set; }
    }
}
