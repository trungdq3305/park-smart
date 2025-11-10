import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { SubscriptionTransactionType } from '../enums/subscription.enum'

export type SubscriptionLogDocument = HydratedDocument<SubscriptionLog>

/**
 * Ghi lại lịch sử thanh toán (giao dịch) cho mỗi Gói thuê bao.
 * Mỗi lần mua mới hoặc gia hạn sẽ tạo ra 1 bản ghi ở đây.
 */
@Schema() // Tự động có createdAt (ngày thanh toán)
export class SubscriptionLog extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription', // ⭐️ Liên kết chặt chẽ với Hợp đồng gốc
    index: true,
  })
  subscriptionId: string

  @Prop({
    required: true,
    type: String,
    unique: true, // ⭐️ Mỗi mã giao dịch từ .NET chỉ được ghi nhận 1 lần
  })
  paymentId: string // Mã giao dịch từ hệ thống thanh toán (ví dụ: "TXN_abc123")

  @Prop({
    required: true,
    type: String,
    enum: Object.values(SubscriptionTransactionType),
  })
  transactionType: SubscriptionTransactionType // Loại giao dịch (Mua mới / Gia hạn)

  @Prop({
    type: Date,
    required: true,
  })
  extendedUntil: Date // ⭐️ Giao dịch này đã gia hạn gói đến ngày nào?
  // (Lưu lại snapshot của 'endDate' mới sau khi gia hạn)

  // (Các trường tùy chọn khác nếu cần, ví dụ: paymentMethod, notes...)
}

export const SubscriptionLogSchema =
  SchemaFactory.createForClass(SubscriptionLog)

// Index để tìm nhanh lịch sử của 1 gói
SubscriptionLogSchema.index({ subscriptionId: 1, createdAt: -1 })
