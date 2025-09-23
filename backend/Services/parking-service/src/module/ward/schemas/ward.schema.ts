import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'

export type WardDocument = HydratedDocument<Ward>
@Schema() // Không sử dụng _id cho Ward
export class Ward {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: string

  @Prop({ required: true, unique: true })
  wardName: string
}

export const WardSchema = SchemaFactory.createForClass(Ward)
