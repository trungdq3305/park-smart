import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto } from 'src/common/dto/params.dto'

// Import các DTOs liên quan đến Reservation
import type {
  ConfirmReservationPaymentDto, // ⭐️ DTO cho API 2
  CreateReservationDto,
  ExtendReservationDto,
  ReservationAvailabilitySlotDto,
  ReservationCancellationPreviewResponseDto,
  ReservationDetailResponseDto,
  ReservationExtensionEligibilityResponseDto,
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
    status: string,
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
   * @param userToken Token của người dùng (để gọi Refund API).
   * @return Trả về true nếu hủy thành công.
   */
  cancelReservationByUser(
    id: IdDto,
    userId: string,
    userToken: string,
  ): Promise<boolean>

  /**
   * (Dùng cho Admin) Cập nhật trạng thái (ví dụ: hủy do vận hành).
   * @param id ID của đơn đặt chỗ.
   * @param updateDto DTO chứa status mới.
   */
  updateReservationStatusByAdmin(
    id: IdDto,
    updateDto: UpdateReservationStatusDto,
    userId: string,
  ): Promise<boolean>

  getReservationAvailability(
    parkingLotId: string,
    dateStr: string, // Input dạng 'YYYY-MM-DD'
  ): Promise<Record<string, ReservationAvailabilitySlotDto>>

  /**
   * ⭐️ BƯỚC 1: Kiểm tra xem có thể gia hạn thêm giờ không?
   * (Logic:
   * 1. Lấy reservation hiện tại.
   * 2. Tính 'newEndTime' = currentEndTime + additionalHours.
   * 3. Gọi Repo 'countConflictingReservations' trong khoảng [currentEndTime, newEndTime].
   * 4. So sánh với 'bookableCapacity'.
   * 5. Nếu còn chỗ -> Tính toán số tiền phải trả thêm ('estimatedCost').
   * )
   * @param id ID của đơn đặt chỗ.
   * @param userId ID người dùng.
   * @param additionalHours Số giờ muốn gia hạn thêm.
   * @param additionalCost Số tiền dự kiến phải trả thêm.
   * @return Thông tin về khả năng gia hạn và chi phí
   */
  checkExtensionEligibility(
    id: IdDto,
    userId: string,
    additionalHours: number,
    additionalCost: number,
  ): Promise<ReservationExtensionEligibilityResponseDto>
  // Trả về: { canExtend: boolean, newEndTime: Date, cost: number, reason?: string }

  /**
   * ⭐️ BƯỚC 2: Thực hiện gia hạn (sau khi User đã thanh toán tiền gia hạn).
   * (Service sẽ:
   * 1. Xác thực 'paymentId' (số tiền phải khớp với cost đã tính ở bước 1).
   * 2. Gọi Repo 'extendReservationEndTime'.
   * 3. Nếu Reservation đang ở trạng thái 'COMPLETED' (đã check-out sớm) -> Có thể cần logic riêng hoặc chặn.
   * Thường chỉ cho gia hạn khi trạng thái là 'CONFIRMED' hoặc 'CHECKED_IN'.
   * )
   * @param id ID của đơn đặt chỗ.
   * @param userId ID người dùng.
   * @param extendDto DTO chứa 'paymentId' và 'additionalHours' (để validate lại lần chót).
   */
  extendReservation(
    id: IdDto,
    userId: string,
    extendDto: ExtendReservationDto,
  ): Promise<ReservationDetailResponseDto>

  getCancellationPreview(
    id: IdDto,
    userId: string,
  ): Promise<ReservationCancellationPreviewResponseDto>
}

export const IReservationService = Symbol('IReservationService')
