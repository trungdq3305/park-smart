// src/reservation/enums/reservation.enum.ts

export enum ReservationStatusEnum {
  /**
   * Mới tạo, chờ thanh toán.
   * Vé chưa hợp lệ cho đến khi thanh toán thành công.
   */
  PENDING_PAYMENT = 'PENDING_PAYMENT', // Chờ thanh toán
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

  /**
   * Hoàn tiền cho người dùng sau khi hủy vé.
   */
  REFUND = 'REFUND',

  /**
   * Hủy do không thanh toán trong thời gian quy định.
   */
  CANCELLED_DUE_TO_NON_PAYMENT = 'CANCELLED_DUE_TO_NON_PAYMENT',

  /**
   * Thanh toán không thành công.
   */
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}
