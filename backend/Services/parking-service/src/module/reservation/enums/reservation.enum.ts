// src/reservation/enums/reservation.enum.ts

export enum ReservationStatusEnum {
  /**
   * Đã thanh toán trả trước (PAID), đang chờ check-in.
   * Đây là trạng thái "vé hợp lệ".
   */
  CONFIRMED = 'CONFIRMED',

  /**
   * Người dùng đã check-in (đã vào bãi).
   * Vé đã hoàn thành nhiệm vụ.
   */
  CHECKED_IN = 'CHECKED_IN',

  /**
   * Người dùng chủ động hủy (trước thời hạn).
   */
  CANCELLED_BY_USER = 'CANCELLED_BY_USER',

  /**
   * Người dùng không đến (ví dụ: quá giờ check-in dự kiến).
   * Sẽ được xử lý bằng một Cron Job.
   */
  EXPIRED = 'EXPIRED',

  /**
   * Admin hoặc hệ thống (ví dụ: lỗi thanh toán) hủy vé.
   */
  CANCELLED_BY_OPERATOR = 'CANCELLED_BY_OPERATOR',
}
