import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

import { ANNOUNCEMENT_STATUSES } from '../enum/announcement.constant' // 🔥 Import hằng số trạng thái

export type AnnouncementDocument = Announcement & Document

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true, trim: true })
  title: string // Tiêu đề thông báo

  @Prop({ required: true })
  content: string // Nội dung chi tiết thông báo

  @Prop({
    type: String,
    enum: ANNOUNCEMENT_STATUSES,
    default: 'DRAFT',
  })
  status: string // Trạng thái (DRAFT, SCHEDULED, PUBLISHED, SENT...)

  @Prop({ required: true, type: Date })
  scheduleAt: Date // Thời gian dự kiến xuất bản (dùng để lên lịch)

  // Lưu ID của các vai trò nhận thông báo
  // Ta dùng mảng ID, sau đó Service sẽ populate/lookup để biết Role name (Driver, Operator,...)
  @Prop({
    type: [{ type: String, ref: 'Role' }],
    default: [],
  })
  recipientRoles: string[]

  @Prop({ type: String, default: 'SYSTEM' })
  type: string // Loại thông báo (VD: SYSTEM, POLICY_UPDATE, PROMOTION)

  @Prop({ type: Date, nullable: true })
  sentAt: Date // Thời gian thực tế được gửi (sau khi Cron Job xử lý)

  @Prop({ type: Types.ObjectId, ref: 'CityAdmin', nullable: true })
  createdBy: Types.ObjectId // Admin tạo thông báo
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement)
