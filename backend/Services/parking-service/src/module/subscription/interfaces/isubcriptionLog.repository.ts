import type { ClientSession } from 'mongoose'

// Import schema (sử dụng tên rút gọn 'SubscriptionLog')
import type { SubscriptionLog } from '../schemas/subcriptionLog.schema'

export interface ISubscriptionLogRepository {
  /**
   * Tạo một bản ghi lịch sử (log) mới (khi mua mới hoặc gia hạn).
   * @param logData Dữ liệu lịch sử (subscriptionId, paymentTransactionId, amount...)
   * @param session (Bắt buộc) Phiên làm việc của transaction.
   */
  createLog(
    logData: Partial<SubscriptionLog>, // Service sẽ chuẩn bị dữ liệu này
    session: ClientSession,
  ): Promise<SubscriptionLog | null>

  /**
   * Lấy tất cả lịch sử của một gói thuê bao (có phân trang).
   * Dùng để hiển thị cho Admin hoặc người dùng.
   * @param subscriptionId ID của gói thuê bao (Subscription) cha.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findLogsBySubscriptionId(
    subscriptionId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: SubscriptionLog[]; total: number }>

  /**
   * (Rất quan trọng) Tìm một bản ghi log bằng mã giao dịch thanh toán.
   * Dùng để kiểm tra xem "bằng chứng thanh toán" này đã được sử dụng hay chưa
   * (vì 'paymentTransactionId' là unique).
   * @param paymentTransactionId ID thanh toán từ .NET service.
   * @param session (Tùy chọn) Phiên làm việc của transaction.
   */
  findLogByPaymentId(
    paymentTransactionId: string,
    session?: ClientSession,
  ): Promise<SubscriptionLog | null>
}

export const ISubscriptionLogRepository = Symbol('ISubscriptionLogRepository')
