import type { ClientSession } from 'mongoose'

// Import DTOs và Schema liên quan đến Subscription
import type {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from '../dto/subscription.dto' // <-- Giả định đường dẫn DTO
import type { Subscription } from '../schemas/subscription.schema' // <-- Giả định đường dẫn Schema

export interface ISubscriptionRepository {
  /**
   * Tạo một gói thuê bao (subscription) mới cho người dùng.
   * (Được gọi sau khi Service đã kiểm tra 'leasedCapacity' và tính toán 'endDate').
   * @param subscriptionData Dữ liệu đầy đủ (bao gồm userId, parkingLotId, v.v.)
   * @param session (Bắt buộc) Phiên làm việc của transaction.
   */
  createSubscription(
    subscriptionData: CreateSubscriptionDto,
    userId: string,
    session: ClientSession,
  ): Promise<Subscription | null>

  /**
   * Tìm một gói thuê bao bằng ID.
   * @param id ID của gói thuê bao.
   * @param userId ID của người dùng (để kiểm tra quyền truy cập nếu cần).
   */
  findSubscriptionById(id: string, userId: string): Promise<Subscription | null>

  /**
   * Tìm một gói thuê bao đang ACTIVE bằng mã định danh (subscriptionIdentifier).
   * Dùng cho logic quét mã QR khi check-in.
   * @param subscriptionIdentifier Chuỗi GUID (v4) từ mã QR.
   */
  findActiveSubscriptionByIdentifier(
    subscriptionIdentifier: string,
  ): Promise<Subscription | null>

  /**
   * Cập nhật trạng thái sử dụng (isUsed) của một gói thuê bao.
   * (true = check-in, false = check-out).
   * @param subscriptionIdentifier Mã định danh của gói thuê bao.
   * @param isUsed Trạng thái sử dụng mới.
   * @param session (Bắt buộc) Phải chạy trong transaction cùng với ParkingSession.
   */
  updateUsageStatus(
    subscriptionIdentifier: string,
    isUsed: boolean,
    session: ClientSession,
  ): Promise<boolean>

  /**
   * Đếm tổng số gói thuê bao đang 'ACTIVE' (chưa hết hạn) của một bãi xe.
   * Dùng để kiểm tra với `leasedCapacity` (Xô 1) trước khi bán gói mới.
   * @param parkingLotId ID của bãi đỗ xe.
   * @param requestedDate Ngày được yêu cầu (để kiểm tra tính hợp lệ của gói).
   * @param session (Tùy chọn) Phiên làm việc của transaction (để đọc nhất quán).
   */
  countActiveOnDateByParkingLot(
    parkingLotId: string,
    requestedDate: Date,
    session?: ClientSession,
  ): Promise<number>

  /**
   * Lấy danh sách tất cả gói thuê bao của một người dùng (có phân trang).
   * @param userId ID của người dùng.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findAllByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Subscription[]; total: number }>

  /**
   * Cập nhật một gói thuê bao (dùng cho Admin, ví dụ: gia hạn, hủy).
   * @param id ID của gói thuê bao.
   * @param updateData Dữ liệu cập nhật từ DTO.
   * @param session Phiên làm việc của transaction.
   */
  updateSubscription(
    id: string,
    updateData: UpdateSubscriptionDto,
    session: ClientSession,
  ): Promise<Subscription | null>

  /**
   * Xóa mềm (hủy) một gói thuê bao.
   * @param id ID của gói thuê bao.
   * @param session (Tùy chọn) Phiên làm việc của transaction.
   */
  softDeleteSubscription(
    id: string,
    userId: string,
    session: ClientSession,
  ): Promise<boolean> // Trả về true nếu thành công
  /**
   * Lấy TẤT CẢ các gói thuê bao (subscription) đang hoạt động
   * hoặc sẽ hoạt động trong tương lai của một bãi xe.
   * (Chỉ lấy các trường cần thiết để tính toán chồng lấn).
   *
   * @param parkingLotId ID của bãi đỗ xe.
   * @param fromDate Chỉ lấy các gói có 'endDate' >= ngày này (thường là hôm nay).
   */
  findActiveAndFutureSubscriptions(
    parkingLotId: string,
    fromDate: Date,
  ): Promise<Pick<Subscription, 'startDate' | 'endDate'>[]> // ⭐️ Chỉ lấy 2 trường
}

export const ISubscriptionRepository = Symbol('ISubscriptionRepository')
