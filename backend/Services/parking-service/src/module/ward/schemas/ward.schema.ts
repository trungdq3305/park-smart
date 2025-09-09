import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema() // Không sử dụng _id cho Ward
export class Ward extends Document {
  @Prop()
  ward_name: string
}

export const WardSchema = SchemaFactory.createForClass(Ward)
