import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { IAnnouncementService } from 'src/module/announcement/interfaces/iannouncement.service'
import { IAccountServiceClient } from 'src/module/client/interfaces/iaccount-service-client'
import { Notification } from 'src/module/notification/schemas/notification.schema' // Import Notification Schema

import {
  CreateNotificationInternalDto,
  NotificationResponseDto,
} from './dto/notification.dto'
import { INotificationRepository } from './interfaces/inotification.repository'
import { INotificationService } from './interfaces/inotification.service'
import { NotificationGateway } from './notification.gateway'
import { NotificationDocument } from './schemas/notification.schema' // Đã sửa tên import nếu cần
import {
  NotificationRole,
  NotificationType,
} from 'src/common/constants/notification.constant'
@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(INotificationRepository)
    private readonly notificationRepository: INotificationRepository,
    private readonly notificationGateway: NotificationGateway,
    @Inject(IAnnouncementService)
    private readonly announcementService: IAnnouncementService,
    @Inject(IAccountServiceClient) // INJECT CLIENT SERVICE
    private readonly accountServiceClient: IAccountServiceClient,
  ) {}

  private toResponseDto(
    notification: NotificationDocument,
  ): NotificationResponseDto {
    // .toJSON() buộc Mongoose chuyển đổi _id và các trường khác thành chuỗi JSON tiêu chuẩn
    const plainObject = notification.toJSON() as Notification // Sử dụng plainToInstance để áp dụng các decorator @Expose (nếu có)

    return plainToInstance(NotificationResponseDto, plainObject, {
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

    // Gửi thông báo đến console server
    console.log(
      '[NotificationService] Đã tạo thông báo thành công. Chuẩn bị gửi qua WS.',
    ) // SỬ DỤNG HÀM MỚI ĐỂ ĐẢM BẢO CHUYỂN ĐỔI KIỂU DỮ LIỆU

    const responseDto = this.toResponseDto(notification) // 2. Gửi qua WebSocket (Real-time)

    this.notificationGateway.sendNotificationToUser(
      dto.recipientId, // Gửi đến phòng cá nhân
      responseDto,
    )
    this.notificationGateway.sendNotificationToUser(
      dto.recipientRole, // Gửi đến phòng chung theo Role
      responseDto,
    )

    console.log(
      `[NotificationService] WS Sent to ID: ${dto.recipientId} and Role: ${dto.recipientRole}`,
    )

    return responseDto
  }

  async getNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const notifications =
      await this.notificationRepository.findByRecipientId(userId) // eslint-disable-next-line @typescript-eslint/unbound-method
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
    } // Tùy chọn: Bạn có thể cần gọi repository để lấy lại data đã được populate
    // Hiện tại, ta sẽ trả về một DTO giả định cho bài toán này, trong thực tế bạn nên fetch lại

    return plainToInstance(
      NotificationResponseDto,
      { _id: notificationId, isRead: true },
      {
        excludeExtraneousValues: true,
      },
    )
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(userId)
  }

  async processScheduledAnnouncements(): Promise<void> {
    const now = new Date()
    const announcements =
      await this.announcementService.getPendingScheduledAnnouncements(now)

    for (const announcement of announcements) {
      // 1. Ánh xạ Role ID sang Role Name (Vẫn cần logic thực tế của bạn)
      const recipientRoles = announcement.recipientRoles.map((id) => id)

      for (const roleName of recipientRoles) {
        // 2. GỌI MICROSERVICE (qua Client Service)
        const userIds =
          await this.accountServiceClient.getUserIdsByRole(roleName)

        // 3. Tạo và gửi Notification
        for (const userId of userIds) {
          const notificationDto: CreateNotificationInternalDto = {
            recipientId: userId,
            recipientRole: roleName as NotificationRole,
            title: announcement.title,
            body: announcement.content,
            type: NotificationType.ANNOUNCEMENT,
          }
          await this.createAndSendNotification(notificationDto)
        }
      }

      // 4. Đánh dấu Announcement đã được xử lý
      await this.announcementService.markAsSent(announcement._id as string)
    }
  }
}
