import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type BasisDocument = HydratedDocument<Basis>

@Schema()
export class Basis extends BaseEntity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true, unique: true })
  basisName: string

  @Prop()
  description: string
}

export const BasisSchema = SchemaFactory.createForClass(Basis)
