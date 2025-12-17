using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreService.Application.DTOs.ParkingLotDtos
{
    public class WardDto
    {
        public string WardName { get; set; }
    }
    public class AddressResponse
    {
        public string _id { get; set; } // Hoặc kiểu dữ liệu phù hợp
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string FullAddress { get; set; }
        public WardDto Ward { get; set; }
    }
    public class ParkingLotResponse
    {
        // Các trường từ JSON response (sử dụng quy tắc đặt tên CamelCase)
        public string _id { get; set; }
        public AddressResponse AddressId { get; set; }

        public int TotalCapacityEachLevel { get; set; }
        public int AvailableSpots { get; set; }
        public string ParkingLotOperatorId { get; set; }
        public string ParkingLotStatus { get; set; }
        public int BookableCapacity { get; set; }
        public int LeasedCapacity { get; set; }
        public int WalkInCapacity { get; set; }
        public int BookingSlotDurationHours { get; set; }
        public int DisplayAvailableSpots { get; set; }
        public string Name { get; set; }
        public string SecretKey { get; set; }

        // Có thể thêm các thuộc tính khác nếu cần
    }
}
