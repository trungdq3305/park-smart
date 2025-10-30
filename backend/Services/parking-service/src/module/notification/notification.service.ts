import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'

import {
  CreateNotificationInternalDto,
  NotificationResponseDto,
} from './dto/notification.dto'
import { INotificationRepository } from './interfaces/inotification.repository'
import { INotificationService } from './interfaces/inotification.service'
import { NotificationGateway } from './notification.gateway'
import { Notification } from './schemas/notification.schema'

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(INotificationRepository)
    private readonly notificationRepository: INotificationRepository,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private toResponseDto(notification: Notification): NotificationResponseDto {
    return plainToInstance(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    })
  }

  async createAndSendNotification(
    dto: CreateNotificationInternalDto,
  ): Promise<NotificationResponseDto> {
    // 1. Lưu vào Database
    const notification = await this.notificationRepository.create(dto)

    if (!notification) {
      throw new BadRequestException('Không thể tạo thông báo')
    }

    const responseDto = this.toResponseDto(notification)

    // 2. Gửi qua WebSocket (Real-time)
    this.notificationGateway.sendNotificationToUser(
      dto.recipientId, // Gửi đến phòng cá nhân
      responseDto,
    )
    this.notificationGateway.sendNotificationToUser(
      dto.recipientRole, // Gửi đến phòng chung theo Role
      responseDto,
    )

    return responseDto
  }

  async getNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findByRecipientId(
      userId,
    )
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return notifications.map(this.toResponseDto)
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.findUnreadCountByRecipientId(userId)
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const isSuccess = await this.notificationRepository.markAsRead(
      notificationId,
      userId,
    )
    if (!isSuccess) {
      throw new NotFoundException('Thông báo không tồn tại hoặc đã được đọc')
    }

    // Tùy chọn: Bạn có thể cần gọi repository để lấy lại data đã được populate
    // Hiện tại, ta sẽ trả về một DTO giả định cho bài toán này, trong thực tế bạn nên fetch lại
    return plainToInstance(NotificationResponseDto, { _id: notificationId, isRead: true }, {
        excludeExtraneousValues: true,
      })
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(userId)
  }
}