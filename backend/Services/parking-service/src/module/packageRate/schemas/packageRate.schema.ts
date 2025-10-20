import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

import { Unit } from '../enums/packageRate.enum'

export type PackageRateDocument = HydratedDocument<PackageRate>

@Schema()
export class PackageRate extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true, type: Number })
  durationAmount: number

  @Prop({
    required: true,
    type: String,
    enum: Object.values(Unit),
  })
  unit: string

  @Prop({ required: true, type: Number })
  price: number

  @Prop({ type: Boolean })
  isUsed: boolean

  @Prop({ type: String, required: true })
  name: string
}

export const PackageRateSchema = SchemaFactory.createForClass(PackageRate)
