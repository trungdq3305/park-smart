import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, Schema as MongooseSchema } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { RequestStatus, RequestType } from '../enums/parkingLot.enum'

export type ParkingLotRequestDocument = HydratedDocument<ParkingLotRequest>

@Schema() // Dùng timestamps để có createdAt, updatedAt
export class ParkingLotRequest extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: String,
    enum: Object.values(RequestType), // 'UPDATE' hoặc 'DELETE'
  })
  requestType: string

  @Prop({
    required: true,
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING,
  })
  status: string

  // payload chứa dữ liệu thay đổi. Dùng Mixed để linh hoạt
  // Sẽ chứa các trường như openTime, closeTime,... khi requestType là 'UPDATE'
  @Prop({ required: false, type: MongooseSchema.Types.Mixed })
  payload?: Record<string, any>

  @Prop({ required: true, type: Date })
  effectiveDate: Date // Ngày thay đổi bắt đầu có hiệu lực

  @Prop({ required: false, type: Date })
  approvalDate?: Date // Ngày admin duyệt

  @Prop({ required: false, type: String })
  rejectionReason?: string // Lý do từ chối

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'ParkingLot',
  })
  parkingLotId?: string // Tham chiếu đến bãi xe
}

export const ParkingLotRequestSchema =
  SchemaFactory.createForClass(ParkingLotRequest)
