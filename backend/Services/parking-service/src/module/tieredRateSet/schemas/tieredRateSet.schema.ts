import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

@Schema({
  _id: false, // Tắt _id cho sub-document, vì thường không cần
})
export class Tier {
  @Prop({ required: true })
  fromHour: string // Mức bắt đầu (ví dụ: 0 kWh, 51 m3)

  @Prop({ required: false, default: null })
  toHour: string | null // Mức kết thúc. 'null' có nghĩa là "trở lên" (bậc cuối cùng)

  @Prop({ required: true })
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

  @Prop({ required: true })
  name: string

  @Prop({
    type: [Tier], // <-- Quan trọng: Đây là một mảng các document theo TierSchema
    required: true,
    default: [], // Đảm bảo luôn là một mảng
  })
  tiers: Tier[] // Mảng chứa các bậc thang giá

  @Prop({ required: true, default: false })
  isUsed: boolean
}

export const TieredRateSetSchema = SchemaFactory.createForClass(TieredRateSet)
