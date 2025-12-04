import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { TransactionTypeEnum } from '../enum/parkingTransaction.enum'

export type ParkingTransactionDocument = HydratedDocument<ParkingTransaction>

@Schema()
export class ParkingTransaction extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    index: true,
  })
  parkingLotId: string

  @Prop({
    required: true,
    type: String,
    enum: Object.values(TransactionTypeEnum),
    index: true,
  })
  type: TransactionTypeEnum

  @Prop({
    required: true,
    type: Number,
  })
  amount: number // Số tiền thực tế (Dương = Thu, Âm = Hoàn trả)

  @Prop({
    required: false,
    type: String,
    index: true,
    sparse: true,
  })
  paymentId: string // ID tham chiếu sang AccountService/Payment Gateway (Xendit)

  @Prop({
    required: true,
    type: Date,
    default: Date.now,
    index: true, // Index quan trọng để query báo cáo theo ngày/tháng
  })
  transactionDate: Date // Thời điểm dòng tiền phát sinh thực tế

  // --- CÁC TRƯỜNG THAM CHIẾU (OPTIONAL) ---
  // Chỉ 1 trong 3 trường này sẽ có giá trị tùy theo 'type'

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: false,
  })
  reservationId?: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: false,
  })
  subscriptionId?: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLotSession',
    required: false,
  })
  sessionId?: string

  @Prop({
    type: String,
    required: false,
  })
  note?: string // Ghi chú thêm (ví dụ: "Hoàn tiền hủy trước hạn 50%")
}

export const ParkingTransactionSchema =
  SchemaFactory.createForClass(ParkingTransaction)

// Index tối ưu cho báo cáo Dashboard
// Giúp query: Tìm doanh thu của Bãi A trong khoảng thời gian T
ParkingTransactionSchema.index({ parkingLotId: 1, transactionDate: 1 })

// Giúp query: Lịch sử ví của User B (sắp xếp mới nhất)
ParkingTransactionSchema.index({ userId: 1, transactionDate: -1 })
