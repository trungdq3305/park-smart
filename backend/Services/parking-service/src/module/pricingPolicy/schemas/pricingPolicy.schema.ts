import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type PricingPolicyDocument = HydratedDocument<PricingPolicy>

@Schema()
export class PricingPolicy extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true })
  name: string

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Basis' })
  basisId: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TieredRateSet',
    required: false,
  })
  tieredRateSetId: string

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageRate',
    required: false,
  })
  packageRateId: string

  @Prop({ type: Number })
  pricePerHour: number

  @Prop({ type: Number })
  fixedPrice: number

  @Prop({ type: Date })
  effectiveDate: Date
}

export const PricingPolicySchema = SchemaFactory.createForClass(PricingPolicy)
// Tạo index để đảm bảo tính duy nhất của 'name' trong phạm vi 'createdBy' khi 'deletedAt' là null
PricingPolicySchema.index(
  { name: 1, createdBy: 1 }, // 1. Phạm vi unique: Tên + Người tạo
  {
    unique: true, // 2. Bắt buộc duy nhất
    partialFilterExpression: { deletedAt: null }, // 3. Chỉ áp dụng khi chưa bị xóa (deletedAt là null)
    background: true,
    name: 'unique_name_per_user_active', // Đặt tên index cho dễ debug
  },
)
