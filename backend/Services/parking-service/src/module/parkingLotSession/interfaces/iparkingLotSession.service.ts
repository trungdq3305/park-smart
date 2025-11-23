import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

// Import DTOs liên quan đến Parking Lot Session
import type {
  CheckInDto,
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
  checkIn(
    parkingLotId: string,
    createDto: CheckInDto,
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
   * @param parkingLotId ID của bãi xe (để tăng tốc độ tìm).
   * @param uidCard UID của thẻ NFC (để tìm phiên đỗ xe).
   */
  calculateCheckoutFee(
    parkingLotId: string,
    pricingPolicyId: string,
    uidCard?: string,
    identifier?: string,
  ): Promise<{
    amount: number
    sessionId: string
    message?: string
  }> // ⭐️ (Trả về DTO Chi phí)

  /**
   * (Check-out Xô 3 - Bước 2) Xác nhận thanh toán và đóng phiên.
   * (Được gọi sau khi Kiosk/Frontend xác nhận .NET service đã thanh toán).
   * @param sessionId ID của phiên (session) cần đóng.
   * @param paymentId ID thanh toán (bằng chứng) từ .NET.
   * @param pricingPolicyId (Tùy chọn) ID của chính sách giá đã áp dụng.
   */
  confirmCheckout(
    sessionId: string,
    userId: string,
    file: Express.Multer.File,
    paymentId?: string,
    pricingPolicyId?: string,
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

  findActiveSession(
    parkingLotId: string,
    identifier?: string,
    nfcUid?: string,
  ): Promise<{
    session: boolean
    images: any[]
    type: 'SUBSCRIPTION' | 'RESERVATION' | 'WALK_IN' | null
  }>
}

export const IParkingLotSessionService = Symbol('IParkingLotSessionService')
