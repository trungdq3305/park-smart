import type { ClientSession } from 'mongoose'

// Import DTOs (nếu cần) hoặc Schema
import type { ParkingLotSession } from '../schemas/parkingLotSession.schema' // <-- Đường dẫn Schema

export interface IParkingLotSessionRepository {
  /**
   * (Check-in) Tạo một phiên đỗ xe (ParkingSession) mới.
   * Đây là "Sổ Log Tổng" cho cả 3 xô.
   * @param sessionData Dữ liệu phiên (parkingLotId, plateNumber, checkInTime, status,
   * và các ID liên kết (reservationId hoặc subscriptionId nếu có)).
   * @param session (Bắt buộc) Phiên làm việc của transaction.
   */
  createSession(
    sessionData: Partial<ParkingLotSession>,
    session: ClientSession,
  ): Promise<ParkingLotSession | null>

  /**
   * (Check-out) Tìm phiên (session) đang 'ACTIVE' bằng biển số xe.
   * Dùng để xử lý khi xe ra khỏi bãi.
   * @param uidCard UID của thẻ NFC.
   * @param parkingLotId ID của bãi đỗ xe (tùy chọn, để tăng tốc độ).
   */
  findActiveSessionByUidCard(
    uidCard: string,
    parkingLotId?: string,
  ): Promise<ParkingLotSession[] | null>

  /**
   * (Check-out) Cập nhật một phiên khi xe rời bãi.
   * @param sessionId ID của phiên (session) cần cập nhật.
   * @param updateData Dữ liệu cập nhật (checkOutTime, status: COMPLETED, amountPaid, paymentStatus).
   * @param session (Bắt buộc) Phiên làm việc của transaction.
   */
  updateSessionOnCheckout(
    sessionId: string,
    updateData: Partial<ParkingLotSession>,
    session: ClientSession,
  ): Promise<boolean>

  /**
   * (Kiểm tra Xô 3) Đếm số lượng xe VÃNG LAI (Walk-in) đang 'ACTIVE' trong bãi.
   * @param parkingLotId ID của bãi đỗ xe.
   * @param session (Tùy chọn) Dùng trong transaction để đọc nhất quán.
   */
  countActiveWalkInSessions(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<number>

  /**
   * (Kiểm tra Xô 2) Đếm số lượng xe ĐẶT TRƯỚC (Reservation) đang 'ACTIVE' trong bãi.
   * @param parkingLotId ID của bãi đỗ xe.
   * @param session (Tùy chọn) Dùng trong transaction.
   */
  countActiveBookedSessions(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<number>

  /**
   * (Kiểm tra Xô 1) Đếm số lượng xe THUÊ BAO (Subscription) đang 'ACTIVE' trong bãi.
   * @param parkingLotId ID của bãi đỗ xe.
   * @param session (Tùy chọn) Dùng trong transaction.
   */
  countActiveLeasedSessions(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<number>

  /**
   * (Lịch sử) Lấy tất cả các phiên đỗ xe của một người dùng (có phân trang).
   * @param userId ID của người dùng.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findAllSessionsByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLotSession[]; total: number }>

  /**
   * (Quản lý bãi) Lấy tất cả các phiên đỗ xe trong một bãi cụ thể (có phân trang).
   * @param parkingLotId ID của bãi đỗ xe.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   * @param startTime (Tùy chọn) Lọc từ thời gian này trở đi.
   * @param endTime (Tùy chọn) Lọc đến thời gian này.
   * @param session (Tùy chọn) Dùng trong transaction.
   */
  findAllSessionsByParkingLotId(
    parkingLotId: string,
    page: number,
    pageSize: number,
    startTime?: Date,
    endTime?: Date,
    session?: ClientSession,
  ): Promise<{ data: ParkingLotSession[]; total: number }>

  findById(
    sessionId: string,
    session?: ClientSession,
  ): Promise<ParkingLotSession | null>

  findActiveSessionBySubscriptionId(
    subscriptionId: string,
    parkingLotId?: string,
  ): Promise<ParkingLotSession | null>
}

export const IParkingLotSessionRepository = Symbol(
  'IParkingLotSessionRepository',
)
