// src/database/base.entity.ts (hoặc một đường dẫn tương tự)
import { Prop } from '@nestjs/mongoose'

export abstract class BaseEntity {
  @Prop({
    type: String, // Lưu ID dưới dạng string. ObjectId cũng là một dạng string.
    required: false,
    index: true,
    default: null,
  })
  createdBy?: string | null

  @Prop({
    type: String,
    required: false,
    index: true,
    default: null,
  })
  updatedBy?: string | null

  @Prop({ type: Date, default: Date.now })
  createdAt: Date

  @Prop({ type: Date, default: null })
  updatedAt?: Date | null

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null // <--- SỬA LẠI THÀNH THẾ NÀ

  @Prop({
    type: String,
    default: null,
    required: false,
    index: true,
  })
  deletedBy?: string | null
}
