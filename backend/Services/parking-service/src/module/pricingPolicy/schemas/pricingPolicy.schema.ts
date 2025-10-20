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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TieredRateSet' })
  tieredRateSetId: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PackageRate' })
  packageRateId: string

  @Prop({ type: Number })
  pricePerHour: number

  @Prop({ type: Number })
  fixedPrice: number

  @Prop({ type: Date })
  effectiveDate: Date
}

export const PricingPolicySchema = SchemaFactory.createForClass(PricingPolicy)
