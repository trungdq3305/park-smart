using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Common.Helpers
{
    public static class TimeConverter
    {
        public static DateTime ToVietnamTime(DateTime utcDateTime)
        {
            if (utcDateTime.Kind != DateTimeKind.Utc)
            {
                throw new ArgumentException("Đầu vào phải là thời gian UTC (DateTimeKind.Utc).");
            }

            // Cộng 7 giờ để chuyển sang giờ Việt Nam (+07:00)
            return utcDateTime.AddHours(7);
        }
    }

}
