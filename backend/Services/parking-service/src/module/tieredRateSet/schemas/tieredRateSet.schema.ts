import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

@Schema({
  _id: false, // Tắt _id cho sub-document, vì thường không cần
})
export class Tier {
  @Prop({ required: true, type: String })
  fromHour: string // Mức bắt đầu (ví dụ: 0 kWh, 51 m3)

  @Prop({ required: false, default: null, type: String })
  toHour: string

  @Prop({ required: true, type: Number })
  price: number // Giá/phí cho bậc này
}

export type TieredRateSetDocument = HydratedDocument<TieredRateSet>

@Schema()
export class TieredRateSet extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true, type: String })
  name: string

  @Prop({
    type: [Tier], // <-- Quan trọng: Đây là một mảng các document theo TierSchema
    required: true,
    default: [], // Đảm bảo luôn là một mảng
  })
  tiers: Tier[] // Mảng chứa các bậc thang giá

  @Prop({ required: true, default: false, type: Boolean })
  isUsed: boolean
}

export const TieredRateSetSchema = SchemaFactory.createForClass(TieredRateSet)
