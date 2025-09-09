// src/database/base.entity.ts (hoặc một đường dẫn tương tự)
import { Prop } from '@nestjs/mongoose'

export abstract class BaseEntity {
  @Prop({
    type: String, // Lưu ID dưới dạng string. ObjectId cũng là một dạng string.
    required: false,
    index: true,
    default: null,
  })
  created_by: string // Kiểu dữ liệu là string

  @Prop({
    type: String,
    required: false,
    index: true,
    default: null,
  })
  updated_by: string

  @Prop({ type: Date, default: Date.now })
  created_at: Date

  @Prop({ type: Date, default: null })
  updated_at: Date

  @Prop({ type: Date, default: null })
  deleted_at: Date

  @Prop({
    type: String,
    default: null,
    required: false,
    index: true,
  })
  deleted_by: string
}
