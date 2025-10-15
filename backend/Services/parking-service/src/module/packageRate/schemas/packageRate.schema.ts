import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type PackageRateDocument = HydratedDocument<PackageRate>

@Schema()
export class PackageRate extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true })
  timePackage: string

  @Prop({ required: true, type: Number })
  price: number
}

export const PackageRateSchema = SchemaFactory.createForClass(PackageRate)
