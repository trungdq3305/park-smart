import type { ClientSession } from 'mongoose'

import type { TransactionFilterDto } from '../dto/parkingTransaction.dto'
import type { ParkingTransaction } from '../schemas/parkingTransaction.schema'

export interface IParkingTransactionRepository {
  /**
   * ⭐️ QUAN TRỌNG NHẤT: Ghi nhận dòng tiền.
   * Chỉ Create, không bao giờ Update/Delete.
   */
  createTransaction(
    data: Partial<ParkingTransaction>,
    session: ClientSession,
  ): Promise<ParkingTransaction>

  /**
   * Tìm giao dịch theo ID (để xem chi tiết)
   */
  findById(id: string): Promise<ParkingTransaction | null>

  /**
   * Tìm theo PaymentId (của Xendit/Gateway).
   * Dùng để kiểm tra Idempotency (tránh xử lý trùng lặp webhook).
   */
  findByPaymentId(paymentId: string): Promise<ParkingTransaction | null>

  /**
   * Lấy danh sách giao dịch (có phân trang & bộ lọc).
   * Dùng cho:
   * 1. Lịch sử ví của User (filter theo userId).
   * 2. Sổ quỹ của Operator (filter theo parkingLotId).
   * 3. Tra soát của Admin.
   */
  findAll(
    filter: TransactionFilterDto,
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingTransaction[]; total: number }>

  /**
   * Hàm tính tổng nhanh (nếu cần thiết cho logic validation)
   * Ví dụ: Tính tổng tiền user đã nạp/tiêu.
   */
  sumAmountByUserId(userId: string): Promise<number>
}

export const IParkingTransactionRepository = Symbol(
  'IParkingTransactionRepository',
)
