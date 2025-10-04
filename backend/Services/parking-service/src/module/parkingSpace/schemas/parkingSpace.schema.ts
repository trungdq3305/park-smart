import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type ParkingSpaceDocument = HydratedDocument<ParkingSpace>

@Schema({ timestamps: true })
export class ParkingSpace extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot', // Tham chiếu đến model ParkingLot
  })
  parkingLotId: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpaceStatus', // Tham chiếu đến model ParkingSpaceStatus
  })
  parkingSpaceStatusId: string

  @Prop({ required: true, type: String })
  code: string

  @Prop({ required: true, type: Number })
  level: number

  @Prop({ required: true, type: Boolean, default: false })
  isElectricCar: boolean
}

export const ParkingSpaceSchema = SchemaFactory.createForClass(ParkingSpace)
