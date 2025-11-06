import type { ClientSession } from 'mongoose'

// Import schema BookingInventory (giả định đường dẫn)
import type { BookingInventory } from '../schemas/bookingInventory.schema'

export interface IBookingInventoryRepository {
  /**
   * Lấy danh sách các bản ghi tồn kho cho một bãi xe trong một khoảng thời gian.
   * Dùng để kiểm tra (validate) xem tất cả các slot bị ảnh hưởng có còn chỗ hay không.
   *
   * @param parkingLotId ID của bãi đỗ xe.
   * @param startTime Thời gian bắt đầu (đã chuẩn hóa).
   * @param endTime Thời gian kết thúc (đã chuẩn hóa, dựa trên BookingSlotDuration).
   * @param session (Tùy chọn) Phiên làm việc (session) của transaction (để đọc nhất quán).
   */
  findInventoriesInTimeRange(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
    session?: ClientSession,
  ): Promise<BookingInventory[]>

  /**
   * Cập nhật (tăng hoặc giảm) `bookedCount` cho tất cả các khung giờ bị ảnh hưởng.
   * Sẽ tự động tạo (upsert) nếu khung giờ chưa tồn tại.
   *
   * @param parkingLotId ID của bãi đỗ xe.
   * @param startTime Thời gian bắt đầu (đã chuẩn hóa).
   * @param endTime Thời gian kết thúc (đã chuẩn hóa).
   * @param increment Giá trị để tăng (ví dụ: +1 cho đặt mới) hoặc giảm (ví dụ: -1 cho hủy).
   * @param session (Bắt buộc) Phải được thực thi trong một transaction.
   */
  updateInventoryCounts(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
    increment: number,
    session: ClientSession,
  ): Promise<boolean> // Trả về true nếu cập nhật thành công

  /**
   * Xóa tất cả các bản ghi tồn kho (inventory) đã lỗi thời (trong quá khứ).
   * Dùng cho Cron Job dọn dẹp dữ liệu.
   *
   * @param cutoffTime Thời gian "cắt" (ví dụ: new Date()).
   * @returns Promise<number> - Số lượng bản ghi đã bị xóa.
   */
  deleteInventoriesBefore(cutoffTime: Date): Promise<number>
}

export const IBookingInventoryRepository = Symbol('IBookingInventoryRepository')
