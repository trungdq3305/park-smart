import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { RequestStatus } from '../enums/parkingLot.enum'

export type ParkingLotDocument = HydratedDocument<ParkingLot>

@Schema()
export class ParkingLot extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  })
  addressId: string

  @Prop({ required: true, type: String })
  parkingLotOperatorId: string

  @Prop({ required: true, type: Number })
  totalCapacityEachLevel: number

  @Prop({ required: true, type: Number })
  totalLevel: number

  @Prop({ required: true, type: Number })
  availableSpots: number

  @Prop({
    required: true,
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING,
  })
  parkingLotStatus: string

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

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  totalCapacity: number // ⭐️ Hệ thống quản lý: 10

  @Prop({
    required: true,
    type: Number,
    min: 1, // Ít nhất là 1 giờ
    default: 3, // Giả định mặc định là 3 giờ
  })
  bookingSlotDurationHours: number
}

export const ParkingLotSchema = SchemaFactory.createForClass(ParkingLot)
