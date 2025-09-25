import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type VehicleTypeDocument = HydratedDocument<VehicleType>
@Schema()
export class VehicleType extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true, unique: true })
  typeName: string
}

export const VehicleTypeSchema = SchemaFactory.createForClass(VehicleType)
