import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { randomUUID } from 'crypto'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { SubscriptionStatusEnum } from '../enums/subscription.enum'

export type SubscriptionDocument = HydratedDocument<Subscription>

/**
 * Quản lý các gói thuê bao dài hạn đã bán cho người dùng (Xô 1).
 * Ghi lại các "hợp đồng" hoặc "vé tháng/tuần" đang có hiệu lực.
 */
@Schema()
export class Subscription extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot', // Bãi xe mà gói này áp dụng
    index: true,
  })
  parkingLotId: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingPolicy', // ⭐️ Tham chiếu đến "sản phẩm" đã mua (ví dụ: "Gói 1 tháng")
    index: true,
  })
  pricingPolicyId: string

  @Prop({
    required: true,
    type: String,
    enum: Object.values(SubscriptionStatusEnum), // ⭐️ 2. Dùng Object.values()
    default: SubscriptionStatusEnum.PENDING_PAYMENT,
  })
  status: SubscriptionStatusEnum

  @Prop({
    required: true,
    type: Date,
  })
  startDate: Date // Ngày gói bắt đầu có hiệu lực

  @Prop({
    required: true,
    type: Date,
  })
  endDate: Date // Ngày gói hết hiệu lực

  @Prop({
    required: true,
    type: Boolean,
    default: false, // ⭐️ Trường quan trọng: 'true' = Đang có 1 xe dùng gói này ở bãi
  })
  isUsed: boolean

  @Prop({
    required: false,
    type: String,
    unique: true,
    sparse: true,
  })
  paymentId: string

  // --- Các trường tùy chọn bạn có thể thêm sau ---
  @Prop({
    type: String,
    unique: true, // Bắt buộc phải là duy nhất
    default: () => randomUUID(), // ⭐️ Tự động tạo
    index: true,
  })
  subscriptionIdentifier: string // (Mã QR hoặc mã định danh duy nhất cho gói này)
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription)

// Tối ưu hóa truy vấn
SubscriptionSchema.index({ parkingLotId: 1, status: 1 })
SubscriptionSchema.index({ createdBy: 1, status: 1 })
