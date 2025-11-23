// (Giả sử file: src/parking-session/enums/parkingSession.enum.ts)

/**
 * Trạng thái VẬT LÝ của phiên đỗ xe
 */
export enum ParkingSessionStatusEnum {
  /**
   * Xe đang ở trong bãi.
   */
  ACTIVE = 'ACTIVE',

  /**
   * Xe đã rời đi và hoàn tất thanh toán (nếu có).
   */
  COMPLETED = 'COMPLETED',
}

/**
 * Trạng thái THANH TOÁN của phiên đỗ xe
 */
export enum PaymentStatusEnum {
  /**
   * (Xô 3) Chờ thanh toán (ví dụ: khách vãng lai chưa ra).
   */
  PENDING = 'PENDING',

  /**
   * (Xô 3 hoặc Xô 2 lố giờ) Đã thanh toán tại cổng ra.
   */
  PAID = 'PAID',

  /**
   * (Xô 3 hoặc Xô 2 lố giờ) Thanh toán tại cổng ra thất bại.
   */
  FAILED = 'FAILED',

  /**
   * (Xô 2) Vé đã được trả trước.
   */
  PREPAID = 'PREPAID',

  /**
   * (Xô 1) Không áp dụng (vì dùng Gói thuê bao).
   */
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}
