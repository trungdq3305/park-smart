import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type AddressDocument = HydratedDocument<Address>

class Point {
  @Prop({
    type: String,
    enum: ['Point'], // Giá trị của trường này bắt buộc phải là 'Point'
    required: true,
  })
  type: string

  @Prop({
    type: [Number], // Kiểu dữ liệu là một mảng các con số
    required: true,
  })
  coordinates: number[] // Mảng này sẽ chứa [longitude, latitude]
}

@Schema()
export class Address extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: mongoose.Schema.Types.ObjectId

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Ward' })
  wardId: mongoose.Schema.Types.ObjectId

  @Prop({ type: Number, required: true })
  latitude: number

  @Prop({ type: Number, required: true })
  longitude: number

  @Prop({ type: String, required: true, trim: true })
  fullAddress: string

  @Prop({ type: String, required: true, trim: true, default: false })
  isUsed: boolean

  @Prop({
    type: Point,
    required: true, // Nên là true để đảm bảo luôn có dữ liệu vị trí
    index: '2dsphere',
  })
  location: Point
}

export const AddressSchema = SchemaFactory.createForClass(Address)
