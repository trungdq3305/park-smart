import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import {
  ParkingSessionStatusEnum,
  PaymentStatusEnum,
} from '../enums/parkingLotSession.enum'

export type ParkingLotSessionDocument = HydratedDocument<ParkingLotSession>

@Schema()
export class ParkingLotSession extends BaseEntity {
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

  // --- CÁC XÔ (BUCKETS) ---
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null,
    index: true,
  })
  reservationId?: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
    index: true,
  })
  subscriptionId?: string

  // ⭐️ BỔ SUNG 1: Liên kết thẻ vật lý (Quan trọng cho Xô 1 & 3)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GuestCard',
    default: null,
    index: true,
  })
  guestCardId?: string

  // ⭐️ BỔ SUNG 2: Lưu Snapshot UID thẻ lúc quẹt (Để tra cứu nhanh mà không cần populate)
  @Prop({ type: String, index: true })
  nfcUid?: string

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  plateNumber: string // Biển số xe vào

  @Prop({
    required: true,
    type: Date,
  })
  checkInTime: Date

  @Prop({
    type: Date,
    default: null,
  })
  checkOutTime?: Date

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ParkingSessionStatusEnum),
    default: ParkingSessionStatusEnum.ACTIVE,
  })
  status: ParkingSessionStatusEnum

  @Prop({
    required: true,
    type: String,
    enum: Object.values(PaymentStatusEnum),
    default: PaymentStatusEnum.PENDING, // Mặc định là chưa thanh toán
  })
  paymentStatus: PaymentStatusEnum

  @Prop({
    type: Number,
    default: 0,
  })
  amountPaid: number

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    required: false,
  })
  paymentId?: string // ID thanh toán từ hệ thống bên ngoài (.NET) (nếu có)

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingPolicy',
    default: null,
    index: true,
  })
  pricingPolicyId?: string

  @Prop({
    type: Number,
    default: 0,
    required: false,
  })
  amountPayAfterCheckOut?: number

  @Prop({
    type: String,
    default: null,
  })
  note?: string
}

export const ParkingLotSessionSchema =
  SchemaFactory.createForClass(ParkingLotSession)

// Index phức hợp
ParkingLotSessionSchema.index({ parkingLotId: 1, status: 1 })
ParkingLotSessionSchema.index({ plateNumber: 1, status: 1 })
ParkingLotSessionSchema.index({ nfcUid: 1, status: 1 }) // Tìm session theo thẻ
