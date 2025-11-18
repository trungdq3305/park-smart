import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

// Import DTOs liên quan đến Parking Lot Session
import type {
  CreateParkingSessionDto,
  ParkingLotSessionResponseDto,
} from '../dto/parkingLotSession.dto' // <-- Giả định đường dẫn DTO

export interface IParkingLotSessionService {
  /**
   * (Check-in Xô 3) Xử lý cho xe Vãng lai vào bãi.
   * (Service sẽ:
   * 1. Kiểm tra 'walkInCapacity' (Xô 3) của bãi xe.
   * 2. Gọi 'updateAvailableSpotsForWebsocket(-1)' (cập nhật DB & gửi WS).
   * 3. Tạo 'ParkingLotSession' (status: ACTIVE, paymentStatus: PENDING).
   * 4. Gọi (proxy) sang 'Image-Service' để tải ảnh lên với 'ownerId' là ID của Session mới.
   * )
   * @param parkingLotId ID của bãi xe (từ URL param).
   * @param createDto DTO chứa 'plateNumber' và 'description'.
   * @param file File ảnh (từ 'multipart/form-data').
   */
  checkInWalkIn(
    parkingLotId: string,
    createDto: CreateParkingSessionDto,
    file: Express.Multer.File,
  ): Promise<ParkingLotSessionResponseDto>

  /**
   * (Check-out Xô 3) Xử lý cho xe Vãng lai ra khỏi bãi.
   * (Service sẽ:
   * 1. Tìm 'ParkingSession' (status: ACTIVE) bằng 'plateNumber'.
   * 2. Tính toán tổng thời gian đỗ (duration).
   * 3. Tìm 'PricingPolicy' (HOURLY/TIERED) đang áp dụng cho bãi xe này.
   * 4. Tính toán tổng tiền (amount) (dùng logic Lũy kế Bậc thang nếu là TIERED).
   * 5. Trả về thông tin (số tiền, paymentId...) để Kiosk/Frontend gọi .NET service.
   * )
   * @param plateNumber Biển số xe đang ra.
   * @param parkingLotId ID của bãi xe (để tăng tốc độ tìm).
   */
  calculateWalkInCheckoutFee(
    plateNumber: string,
    parkingLotId: string,
  ): Promise<any> // ⭐️ (Trả về DTO Chi phí)

  /**
   * (Check-out Xô 3 - Bước 2) Xác nhận thanh toán và đóng phiên.
   * (Được gọi sau khi Kiosk/Frontend xác nhận .NET service đã thanh toán).
   * @param sessionId ID của phiên (session) cần đóng.
   * @param paymentId ID thanh toán (bằng chứng) từ .NET.
   */
  confirmWalkInCheckout(sessionId: string, paymentId: string): Promise<boolean>

  /**
   * (Hàm nội bộ - Gửi WebSocket)
   * Cập nhật 'availableSpots' trong DB và phát sóng (broadcast) cho client.
   * @param parkingLotId ID của bãi xe.
   * @param change Số lượng thay đổi (-1 khi Check-in, +1 khi Check-out).
   */
  updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<boolean>

  /**
   * (Lịch sử) Lấy tất cả các phiên đỗ xe của một người dùng (có phân trang).
   * @param userId ID của người dùng.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllSessionsByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotSessionResponseDto[]
    pagination: PaginationDto
  }>

  /**
   * (Lịch sử/Admin) Lấy tất cả các phiên đỗ xe của 1 bãi (có phân trang).
   * @param parkingLotId ID của bãi đỗ xe.
   * @param paginationQuery Tùy chọn phân trang.
   */
  findAllSessionsByParkingLot(
    parkingLotId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotSessionResponseDto[]
    pagination: PaginationDto
  }>

  /**
   * (Lịch sử/Admin) Lấy chi tiết 1 phiên và các ảnh liên quan.
   * (Service sẽ gọi sang Image-Service để lấy ảnh).
   * @param sessionId ID của phiên (session).
   */
  getSessionDetailsWithImages(
    sessionId: string,
  ): Promise<ParkingLotSessionResponseDto & { images: any[] }> // (Trả về DTO gộp)
}

export const IParkingLotSessionService = Symbol('IParkingLotSessionService')
