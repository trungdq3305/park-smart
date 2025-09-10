import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'

@Schema() // Không sử dụng _id cho Ward
export class Ward {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  })
  _id: mongoose.Schema.Types.ObjectId

  @Prop({ required: true, unique: true })
  wardName: string
}

export const WardSchema = SchemaFactory.createForClass(Ward)
