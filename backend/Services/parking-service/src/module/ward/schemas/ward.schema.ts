import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema() // Không sử dụng _id cho Ward
export class Ward extends Document {
  @Prop()
  wardName: string
}

export const WardSchema = SchemaFactory.createForClass(Ward)
