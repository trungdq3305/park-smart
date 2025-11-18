import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

// 1. Import các Enum mới
import {
  ParkingSessionStatusEnum,
  PaymentStatusEnum,
} from '../enums/parkingLotSession.enum'

export type ParkingLotSessionDocument = HydratedDocument<ParkingLotSession>

/**
 * Ghi lại lịch sử (log) của TẤT CẢ các xe ra/vào bãi (Xô 1, 2, và 3).
 * Dùng để quản lý 'availableSpots' và 'walkInCapacity' (Xô 3).
 */
@Schema() // Không cần timestamps, vì đã có BaseEntity
export class ParkingLotSession extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string // Theo yêu cầu của bạn

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot', // Khớp với 'parkingLotid'
    index: true,
  })
  parkingLotId: string

  // --- Liên kết Xô (Rất quan trọng) ---
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation', // (Xô 2) Khớp với 'reservationid'
    default: null,
    index: true,
  })
  reservationId: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription', // (Xô 1) Bổ sung
    default: null,
    index: true,
  })
  subscriptionId: string
  // (Nếu cả 2 đều null -> đây là Xô 3 Vãng lai)

  @Prop({
    required: true,
    type: String, // Khớp với 'plateNumber'
    index: true,
  })
  plateNumber: string // Biển số xe thực tế lúc check-in

  @Prop({
    required: true,
    type: Date, // Khớp với 'goInAt'
  })
  checkInTime: Date // Thời gian THỰC TẾ xe vào

  @Prop({
    type: Date,
    default: null, // Khớp với 'goOutAt'
  })
  checkOutTime: Date // Thời gian THỰC TẾ xe ra (null = đang đỗ)

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ParkingSessionStatusEnum),
    default: ParkingSessionStatusEnum.ACTIVE,
  })
  status: ParkingSessionStatusEnum // Bổ sung (Trạng thái vật lý)

  @Prop({
    required: true,
    type: String,
    enum: Object.values(PaymentStatusEnum),
  })
  paymentStatus: PaymentStatusEnum // Bổ sung (Trạng thái thanh toán)

  @Prop({
    type: Number,
    default: 0, // Khớp với 'amountPaid'
  })
  amountPaid: number // Tiền đã trả (cho Xô 3 hoặc phụ thu Xô 2)
}

export const ParkingLotSessionSchema =
  SchemaFactory.createForClass(ParkingLotSession)

// Index để tìm nhanh các phiên đang ACTIVE của 1 bãi xe
ParkingLotSessionSchema.index({ parkingLotId: 1, status: 1 })
// Index để tìm nhanh xe bằng biển số
ParkingLotSessionSchema.index({ plateNumber: 1, status: 1 })
