import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type TieredRateDocument = HydratedDocument<TieredRate>

@Schema()
export class TieredRate extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TieredRateSet',
  })
  tieredRateSetId: string

  @Prop({ required: true, type: Number })
  fromHour: number

  @Prop({ required: false, type: Number }) // Cho phép null cho bậc giá cuối cùng
  toHour: number

  @Prop({ required: true, type: Number })
  price: number
}

export const TieredRateSchema = SchemaFactory.createForClass(TieredRate)
