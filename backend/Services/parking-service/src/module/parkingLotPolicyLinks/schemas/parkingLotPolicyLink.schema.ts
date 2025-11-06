import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type ParkingLotPolicyLinkDocument =
  HydratedDocument<ParkingLotPolicyLink>

@Schema()
export class ParkingLotPolicyLink extends BaseEntity {
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

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingPolicy',
  })
  pricingPolicyId: string

  @Prop({ required: true, type: Number, default: 10 })
  priority: number

  @Prop({ required: true, type: Date })
  startDate: Date

  @Prop({ required: true, type: Date })
  endDate: Date
}

export const ParkingLotPolicyLinkSchema =
  SchemaFactory.createForClass(ParkingLotPolicyLink)
