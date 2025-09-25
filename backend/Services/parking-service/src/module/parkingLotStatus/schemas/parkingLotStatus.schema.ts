import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'

export type ParkingLotStatusDocument = HydratedDocument<ParkingLotStatus>
@Schema()
export class ParkingLotStatus {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true, unique: true })
  status: string

  @Prop({ required: true, type: Number })
  order: number
}

export const ParkingLotStatusSchema =
  SchemaFactory.createForClass(ParkingLotStatus)
