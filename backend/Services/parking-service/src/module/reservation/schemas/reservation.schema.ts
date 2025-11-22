import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

// 1. Import Enum mới
import { ReservationStatusEnum } from '../enums/reservation.enum'

export type ReservationDocument = HydratedDocument<Reservation>

/**
 * Quản lý các đơn đặt chỗ (vé) ngắn hạn đã bán cho người dùng (Xô 2).
 * Được tạo sau khi kiểm tra 'BookingInventory' và thanh toán thành công.
 */
@Schema()
export class Reservation extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot', // Bãi xe được đặt
    index: true,
  })
  parkingLotId: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingPolicy', // Chính sách giá đã dùng để tính tiền
  })
  pricingPolicyId: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion', // (Nếu có áp dụng khuyến mãi)
    default: null,
  })
  promotionId: string // Tương ứng 'promotionsid'

  @Prop({
    required: true,
    type: Date,
  })
  inventoryTimeSlot: Date // Khung giờ chuẩn (9:00) đã chiếm trong BookingInventory

  @Prop({
    required: true,
    type: Date,
  })
  userExpectedTime: Date // Giờ chính xác khách chọn (9:15)

  @Prop({
    required: true,
    type: Date,
  })
  estimatedEndTime: Date // Giờ dự kiến kết thúc (11:15)

  @Prop({
    required: true,
    type: Number,
  })
  prepaidAmount: number // Số tiền đã trả trước (tương ứng 'total_price')

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ReservationStatusEnum), // ⭐️ SỬA ĐỔI QUAN TRỌNG
    default: ReservationStatusEnum.PENDING_PAYMENT,
  })
  status: ReservationStatusEnum // ⭐️ Thay thế cho 'reservation_status_id'

  @Prop({
    required: false,
    type: String,
    unique: true, // ⭐️ RẤT QUAN TRỌNG: Chống lạm dụng
    index: true,
    sparse: true,
  })
  paymentId: string

  @Prop({
    type: String,
    unique: true, // ⭐️ 2. Bắt buộc unique
    default: () => randomUUID(), // ⭐️ 3. Tự động tạo UUID v4
    index: true,
  })
  reservationIdentifier: string
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation)

// Tối ưu hóa truy vấn
ReservationSchema.index({ parkingLotId: 1, status: 1 })
ReservationSchema.index({ userId: 1, status: 1 })
