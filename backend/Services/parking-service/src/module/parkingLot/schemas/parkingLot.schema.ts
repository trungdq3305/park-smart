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
  availableSpots: number

  @Prop({
    required: true,
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING,
  })
  parkingLotStatus: string

  @Prop({ required: true, type: Number })
  electricCarPercentage: number
}

export const ParkingLotSchema = SchemaFactory.createForClass(ParkingLot)
