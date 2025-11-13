import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto } from 'src/common/dto/params.dto'

// Import các DTOs liên quan đến Reservation
import type {
  ConfirmReservationPaymentDto, // ⭐️ DTO cho API 2
  CreateReservationDto,
  ReservationDetailResponseDto,
  UpdateReservationStatusDto, // (Cho Admin)
} from '../dto/reservation.dto' // <-- Giả định đường dẫn DTO

export interface IReservationService {
  /**
   * (API 1) Tạo một "hóa đơn" (draft) Đặt chỗ mới (Xô 2).
   * (Service sẽ:
   * 1. Kiểm tra 'BookingSlotDuration' để xác định các khung giờ bị ảnh hưởng.
   * 2. Kiểm tra 'BookingInventory' (findInventoriesInTimeRange).
   * 3. So sánh 'bookedCount' với 'bookableCapacity'.
   * 4. Tính toán 'prepaidAmount' (trả trước) dựa trên PricingPolicy.
   * 5. "Giữ chỗ" bằng cách gọi 'updateInventoryCounts(+1)'.
   * 6. Tạo 'Reservation' (Hóa đơn) với status 'PENDING_PAYMENT'.
   * 7. (Cron Job sẽ dọn dẹp Hóa đơn này nếu quá 10 phút).
   * )
   * @param createDto Dữ liệu để tạo đơn (userExpectedTime, parkingLotId...)
   * @param userId ID của người dùng đang đặt.
   */
  createReservation(
    createDto: CreateReservationDto,
    userId: string,
  ): Promise<ReservationDetailResponseDto> // Trả về bản nháp (PENDING)

  /**
   * (API 2) Kích hoạt (Confirm) một "hóa đơn" Đặt chỗ đã thanh toán.
   * (Service sẽ:
   * 1. Tìm 'Reservation' đang 'PENDING_PAYMENT'.
   * 2. Xác thực 'paymentId' với .NET service (check status, userId).
   * 3. Kiểm tra 'findReservationByPaymentId' (để chống lạm dụng).
   * 4. Cập nhật (UPDATE) 'Reservation' sang status 'CONFIRMED' và gán 'paymentId'.
   * )
   * @param id ID của đơn Reservation đang 'PENDING'.
   * @param confirmDto DTO chứa 'paymentId' (bằng chứng thanh toán).
   * @param userId ID của người dùng (để xác thực).
   */
  confirmReservationPayment(
    id: IdDto,
    confirmDto: ConfirmReservationPaymentDto,
    userId: string,
  ): Promise<boolean> // Trả về vé đã 'CONFIRMED'

  /**
   * Lấy danh sách tất cả đơn đặt chỗ của người dùng hiện tại (có phân trang).
   * @param userId ID của người dùng.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ReservationDetailResponseDto[]
    pagination: PaginationDto
  }>

  /**
   * Lấy thông tin chi tiết một đơn đặt chỗ bằng ID.
   * (Service sẽ kiểm tra quyền sở hữu của 'userId').
   * @param id ID của đơn đặt chỗ.
   */
  findReservationById(id: IdDto): Promise<ReservationDetailResponseDto>

  /**
   * (Dùng cho BARIE/SCANNER) Lấy vé 'CONFIRMED' bằng mã QR.
   * @param reservationIdentifier Chuỗi GUID (v4) từ mã QR.
   */
  findValidReservationForCheckIn(
    reservationIdentifier: string,
  ): Promise<ReservationDetailResponseDto>

  /**
   * Hủy một đơn đặt chỗ (do người dùng thực hiện).
   * (Service sẽ kiểm tra quyền, logic (ví dụ: 5 ngày), và
   * gọi 'updateInventoryCounts(-1)' để *trả lại* slot nếu là 'CONFIRMED'
   * hoặc 'PENDING_PAYMENT').
   * @param id ID của đơn đặt chỗ cần hủy.
   * @param userId ID của người dùng đang thực hiện.
   */
  cancelReservationByUser(id: IdDto, userId: string): Promise<boolean>

  /**
   * (Dùng cho Admin) Cập nhật trạng thái (ví dụ: hủy do vận hành).
   * @param id ID của đơn đặt chỗ.
   * @param updateDto DTO chứa status mới.
   */
  updateReservationStatusByAdmin(
    id: IdDto,
    updateDto: UpdateReservationStatusDto,
  ): Promise<ReservationDetailResponseDto>

  /**
   * Tự động cập nhật các đơn đặt chỗ quá hạn thành 'EXPIRED'.
   * (Chạy trong cron job).
   */
  updateOverdueReservationsToExpired(): Promise<void>
}

export const IReservationService = Symbol('IReservationService')
