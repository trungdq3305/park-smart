using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.AuthDtos
{
    // File: FullOperatorCreationRequest.cs
    public class FullOperatorCreationRequest
    {
        // DTO này nên chứa tất cả các trường cần thiết, thay vì lồng 3 DTO
        // để tránh lỗi tham số thừa, nhưng để đơn giản theo yêu cầu
        // tôi sẽ giữ cấu trúc lồng, giả định các DTO con đã có.

        // Nếu OperatorRegisterRequest đã có đủ, ta chỉ cần thêm data Address và ParkingLot
        public OperatorRegisterRequest RegisterRequest { get; set; }

        // Yêu cầu Tạo Địa chỉ (dựa trên Swagger bạn gửi)
        public class AddressCreationRequest
        {
            public string FullAddress { get; set; }
            public string WardId { get; set; }
            public double Latitude { get; set; }
            public double Longitude { get; set; }

        }
        public AddressCreationRequest AddressRequest { get; set; }

        // Yêu cầu Tạo Bãi đỗ xe (dựa trên Swagger bạn gửi)
        public class ParkingLotCreationRequest
        {
            public string AddressId { get; set; } // Sẽ được gán trong quá trình thực thi
            public string Name { get; set; }
            public int TotalCapacityEachLevel { get; set; }
            public int TotalLevel { get; set; }
            public string EffectiveDate { get; set; } // Hoặc DateTime nếu bạn dùng object
            public int BookableCapacity { get; set; }
            public int LeasedCapacity { get; set; }
            public int WalkInCapacity { get; set; }
            public int BookingSlotDurationHours { get; set; }
            public string ParkingLotOperatorId { get; set; }
        }
        public ParkingLotCreationRequest ParkingLotRequest { get; set; }
    }
}
