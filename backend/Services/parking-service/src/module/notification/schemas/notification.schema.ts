import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import {
  NotificationRole,
  NotificationType,
} from 'src/common/constants/notification.constant'
import { BaseEntity } from 'src/common/schema/baseEntity.schema'

export type NotificationDocument = HydratedDocument<Notification>

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends BaseEntity {
  @Prop({ type: String, required: true, index: true })
  recipientId: string

  @Prop({ type: String, enum: NotificationRole, required: true })
  recipientRole: NotificationRole

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType

  @Prop({ type: String, required: true })
  title: string

  @Prop({ type: String, required: true })
  body: string

  @Prop({ type: Object, default: {} })
  data: Record<string, any>

  @Prop({ type: Boolean, default: false })
  isRead: boolean
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)
NotificationSchema.index({ recipientId: 1, isRead: 1 })
