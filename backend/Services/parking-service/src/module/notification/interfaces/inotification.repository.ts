import type { CreateNotificationInternalDto } from '../dto/notification.dto'
import type { NotificationDocument } from '../schemas/notification.schema'

export interface INotificationRepository {
  create(dto: CreateNotificationInternalDto): Promise<NotificationDocument>
  findByRecipientId(userId: string): Promise<NotificationDocument[]>
  findUnreadCountByRecipientId(userId: string): Promise<number>
  markAsRead(notificationId: string, userId: string): Promise<boolean>
  markAllAsRead(userId: string): Promise<number>
}

export const INotificationRepository = Symbol('INotificationRepository')