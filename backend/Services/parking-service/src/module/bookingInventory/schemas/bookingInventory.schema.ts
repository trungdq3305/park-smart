import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type BookingInventoryDocument = HydratedDocument<BookingInventory>

/**
 * Quản lý "tồn kho ảo" cho việc đặt chỗ.
 * Mỗi bản ghi đại diện cho một khung giờ (đã chuẩn hóa) của một bãi xe.
 */
@Schema()
export class BookingInventory extends BaseEntity {
  // Chúng ta kế thừa _id từ BaseEntity,
  // không cần định nghĩa lại _id như trong ParkingLot của bạn.

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot', // Tham chiếu đến bãi đỗ xe
    index: true, // Thêm index để tìm kiếm nhanh
  })
  parkingLotId: string

  @Prop({
    required: true,
    type: Date,
    index: true, // Thêm index để tìm kiếm nhanh
  })
  timeSlot: Date // Khung giờ đã được chuẩn hóa (ví dụ: 9:00, 10:00)

  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  bookedCount: number // ⭐️ Số lượng suất đã được đặt trong khung giờ này
}

export const BookingInventorySchema =
  SchemaFactory.createForClass(BookingInventory)

// --- RẤT QUAN TRỌNG ---
// Tạo một index tổ hợp (compound index) độc nhất (unique).
// Điều này đảm bảo không bao giờ có 2 bản ghi cho
// cùng 1 bãi xe, cùng 1 khung giờ.
BookingInventorySchema.index({ parkingLotId: 1, timeSlot: 1 }, { unique: true })
