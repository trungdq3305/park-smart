import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type VehicleDocument = HydratedDocument<Vehicle>

@Schema()
export class Vehicle extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: mongoose.Schema.Types.ObjectId

  @Prop({ required: true, unique: true })
  plateNumber: string

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Color' })
  colorId: mongoose.Schema.Types.ObjectId

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Brand' })
  brandId: mongoose.Schema.Types.ObjectId

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleType',
  })
  vehicleTypeId: mongoose.Schema.Types.ObjectId

  @Prop({ required: true })
  driverId: string
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle)
