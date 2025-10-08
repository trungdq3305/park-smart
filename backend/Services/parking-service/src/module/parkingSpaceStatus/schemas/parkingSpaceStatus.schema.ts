import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'

export type ParkingSpaceStatusDocument = HydratedDocument<ParkingSpaceStatus>

@Schema()
export class ParkingSpaceStatus {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true, unique: true })
  status: string
}

export const ParkingSpaceStatusSchema =
  SchemaFactory.createForClass(ParkingSpaceStatus)
