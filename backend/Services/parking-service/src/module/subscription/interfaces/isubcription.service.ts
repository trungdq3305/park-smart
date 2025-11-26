import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto } from 'src/common/dto/params.dto'

// Import các DTOs liên quan đến Subscription
import type {
  AvailabilitySlotDto,
  CreateSubscriptionDto,
  SubscriptionCancellationPreviewResponseDto,
  SubscriptionDetailResponseDto,
  SubscriptionLogDto,
  SubscriptionRenewalEligibilityResponseDto,
  UpdateSubscriptionDto,
} from '../dto/subscription.dto' // <-- Giả định đường dẫn DTO

export interface ISubscriptionService {
  /**
   * Tạo (Mua) một gói thuê bao mới.
   * (Service sẽ kiểm tra 'leasedCapacity' (Xô 1) của bãi xe,
   * tính toán endDate, và xử lý thanh toán (cashless) trước khi tạo).
   * @param createDto Dữ liệu để tạo gói thuê bao (từ client).
   * @param userId ID của người dùng đang thực hiện (người mua).
   */
  createSubscription(
    createDto: CreateSubscriptionDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> // Trả về gói đã tạo (sau khi thanh toán)

  /**
   * Lấy danh sách tất cả gói thuê bao của người dùng hiện tại (có phân trang).
   * @param userId ID của người dùng.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: SubscriptionDetailResponseDto[]
    pagination: PaginationDto
  }>

  /**
   * Lấy thông tin chi tiết một gói thuê bao bằng ID.
   * (Service sẽ kiểm tra quyền sở hữu, đảm bảo người dùng chỉ thấy gói của mình).
   * @param id ID của gói thuê bao.
   * @param userId ID của người dùng (để kiểm tra quyền).
   */
  findSubscriptionById(
    id: IdDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto>

  /**
   * Dùng cho BARIE/SCANNER khi quét QR.
   * Lấy thông tin gói thuê bao đang hoạt động bằng mã định danh (từ QR code).
   * (Dùng cho logic check-in, không cần userId).
   * @param subscriptionIdentifier Chuỗi GUID (v4) từ mã QR.
   */
  findActiveSubscriptionByIdentifier(
    subscriptionIdentifier: string,
  ): Promise<SubscriptionDetailResponseDto>

  /**
   * Hủy một gói thuê bao (do người dùng thực hiện).
   * (Service sẽ kiểm tra quyền sở hữu và logic, ví dụ: không thể hủy
   * nếu đang có xe trong bãi 'isUsed: true').
   * @param id ID của gói thuê bao cần hủy.
   * @param userId ID của người dùng đang thực hiện.
   * @param userToken Token của người dùng (để xác thực khi gọi dịch vụ thanh toán).
   */
  cancelSubscription(
    id: IdDto,
    userId: string,
    userToken: string,
  ): Promise<boolean>

  /**
   * Gia hạn một gói thuê bao (do người dùng chủ động).
   * (Service sẽ kích hoạt luồng thanh toán (cashless) cho chu kỳ tiếp theo).
   * @param id ID của gói thuê bao cần gia hạn.
   * @param paymentId ID của thanh toán cho việc gia hạn.
   * @param userId ID của người dùng đang thực hiện.
   */
  renewSubscription(
    id: IdDto,
    paymentId: string,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto>

  /**
   * Cập nhật một gói thuê bao (dùng cho Admin).
   * (Cho phép Admin can thiệp thủ công, ví dụ: đổi 'endDate' hoặc 'status').
   * @param id ID của gói thuê bao.
   * @param updateDto Dữ liệu cập nhật.
   */
  updateSubscriptionByAdmin(
    id: IdDto,
    updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDetailResponseDto>

  /**
   * (Dành cho Khách hàng) Lấy bản đồ/lịch tình trạng còn
   * suất thuê bao (Xô 1) cho 15 ngày tới.
   * @param parkingLotId ID của bãi xe.
   */
  getSubscriptionAvailability(
    parkingLotId: string,
  ): Promise<Record<string, AvailabilitySlotDto>>

  /**
   * Công việc định kỳ để đánh dấu các gói thuê bao đã hết hạn.
   * Chạy hàng ngày để cập nhật trạng thái các gói thuê bao.
   */
  setExpiredSubscriptionsJob(): Promise<void>

  /**
   * Lấy tất cả lịch sử (logs) của một gói thuê bao (có phân trang).
   * Dùng để hiển thị cho Admin hoặc người dùng.
   * @param subscriptionId ID của gói thuê bao (Subscription) cha.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findLogsBySubscriptionId(
    subscriptionId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: SubscriptionLogDto[]; pagination: PaginationDto }>

  handlePendingSubscriptionsTimeout(): Promise<void>

  updateSubscriptionPaymentId(
    subscriptionId: string,
    userId: string,
    paymentId: string,
  ): Promise<SubscriptionDetailResponseDto>

  sendExpiringSubscriptionNotificationsJob(): Promise<void>

  checkRenewalEligibility(
    id: string,
    userId: string,
  ): Promise<SubscriptionRenewalEligibilityResponseDto>

  getCancellationPreview(
    id: IdDto,
    userId: string,
  ): Promise<SubscriptionCancellationPreviewResponseDto>
}

export const ISubscriptionService = Symbol('ISubscriptionService')
