import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type ParkingLotHistoryLogDocument =
  HydratedDocument<ParkingLotHistoryLog>

@Schema()
export class ParkingLotHistoryLog extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
  })
  parkingLotId: string

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

  @Prop({ required: true, type: Date })
  effectiveDate: Date

  @Prop({ required: true, type: Date })
  approvalDate: Date

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLotStatus',
  })
  parkingLotStatusId: string
}

export const ParkingLotHistoryLogSchema =
  SchemaFactory.createForClass(ParkingLotHistoryLog)
