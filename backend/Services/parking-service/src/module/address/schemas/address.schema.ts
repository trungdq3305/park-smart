import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type AddressDocument = HydratedDocument<Address>

@Schema()
export class Address extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: mongoose.Schema.Types.ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  wardId: mongoose.Schema.Types.ObjectId

  @Prop({ type: Number, required: true })
  latitude: number

  @Prop({ type: Number, required: true })
  longitude: number

  @Prop({ type: String, required: true, trim: true })
  fullAddress: string
}

export const AddressSchema = SchemaFactory.createForClass(Address)
