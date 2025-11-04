// src/module/notification/interfaces/inotification.service.ts

// Thay đổi từ CreateNotificationDto thành CreateNotificationInternalDto
import type {
  CreateNotificationInternalDto,
  NotificationResponseDto,
} from '../dto/notification.dto'

export interface INotificationService {
  processScheduledAnnouncements(): Promise<void>
  getNotifications(userId: string): unknown
  markAllAsRead(userId: string): unknown
  createAndSendNotification(
    createNotificationDto: CreateNotificationInternalDto, // Cập nhật tên tham số nếu cần
  ): Promise<NotificationResponseDto>
  
  getUnreadCount(userId: string): Promise<number>
  markAsRead(notificationId: string, userId: string): Promise<NotificationResponseDto>
  
}

export const INotificationService = Symbol('INotificationService')