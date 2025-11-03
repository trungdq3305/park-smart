import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, Schema as MongooseSchema } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { RequestType } from '../enums/parkingLot.enum'

export type ParkingLotHistoryLogDocument =
  HydratedDocument<ParkingLotHistoryLog>

@Schema({ timestamps: true })
export class ParkingLotHistoryLog extends BaseEntity {
  // Giữ lại _id như bình thường
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  // Giữ lại parkingLotId để biết log này của bãi xe nào
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'ParkingLot',
  })
  parkingLotId: string

  // (NÊN THÊM) Ghi lại loại sự kiện
  @Prop({
    required: true,
    type: String,
    enum: Object.values(RequestType),
  })
  eventType: string

  // (SỬA) Đổi tên và đặt làm tham chiếu bắt buộc
  // Đây là liên kết để biết yêu cầu nào đã gây ra log này
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'ParkingLotRequest',
  })
  requestId: string

  // ---- CÁC TRƯỜNG SNAPSHOT DỮ LIỆU (GIỮ NGUYÊN) ----
  @Prop({ required: false, type: String })
  openTime: string

  @Prop({ required: false, type: String })
  closeTime: string

  @Prop({ required: false, type: Boolean })
  is24Hours: boolean

  @Prop({ required: true, type: Number })
  maxVehicleHeight: number

  @Prop({ required: true, type: Number })
  maxVehicleWidth: number

  @Prop({ required: true, type: Number })
  totalCapacityEachLevel: number

  @Prop({ required: true, type: Number })
  totalLevel: number

  @Prop({ required: true, type: Number })
  electricCarPercentage: number

  // Giữ lại effectiveDate để biết thay đổi này có hiệu lực từ khi nào
  @Prop({ required: true, type: Date })
  effectiveDate: Date

  @Prop({
    required: true,
    type: Number,
    min: 0,
    default: 0,
  })
  bookableCapacity: number // ⭐️ MỚI: Số suất TỐI ĐA cho đặt trước (ví dụ: 30)
  // Đây là "Xô đặt trước" (booking quota)

  // --- Xô 1 (Thuê dài hạn) ---
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  leasedCapacity: number // ⭐️ Admin đặt: 20

  // --- Xô 3 (Vãng lai) ---
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  walkInCapacity: number // ⭐️ Admin đặt: 50

  @Prop({
    required: true,
    type: Number,
    min: 1, // Ít nhất là 1 giờ
    default: 3, // Giả định mặc định là 3 giờ
  })
  bookingSlotDurationHours: number
}

export const ParkingLotHistoryLogSchema =
  SchemaFactory.createForClass(ParkingLotHistoryLog)
