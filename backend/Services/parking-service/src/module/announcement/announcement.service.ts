import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { NotificationType } from 'src/common/constants/notification.constant'
import { IAccountServiceClient } from 'src/module/client/interfaces/iaccount-service-client' // Thêm import này
import { INotificationService } from 'src/module/notification/interfaces/inotification.service'

import {
  AnnouncementResponseDto,
  CreateAnnouncementDto,
} from './dto/announcement.dto'
import { IAnnouncementRepository } from './interfaces/iannouncement.repository'
import { IAnnouncementService } from './interfaces/iannouncement.service'
import { AnnouncementDocument } from './schemas/announcement.schema'
@Injectable()
export class AnnouncementService implements IAnnouncementService {
  constructor(
    @Inject(IAnnouncementRepository)
    private readonly announcementRepository: IAnnouncementRepository,
    @Inject(forwardRef(() => INotificationService))
    private readonly notificationService: INotificationService,
    // Thêm AccountServiceClient để lấy UserIds
    @Inject(IAccountServiceClient)
    private readonly accountServiceClient: IAccountServiceClient,
  ) {}

  private toResponseDto(
    announcement: AnnouncementDocument,
  ): AnnouncementResponseDto {
    const plainObject = announcement.toJSON() as any // Chuyển sang plain object để dễ dàng chuyển đổi
    return plainToInstance(AnnouncementResponseDto, plainObject, {
      excludeExtraneousValues: true,
    })
  }

  async create(
    dto: CreateAnnouncementDto,
    createdBy: string,
  ): Promise<AnnouncementResponseDto> {
    const originalDate = new Date(dto.scheduleAt)

    // 1. Đặt giờ, phút, giây, mili giây về 0:0:0:0 (đầu ngày)
    originalDate.setHours(0, 0, 0, 0)
    const scheduleDate = new Date(originalDate.getTime() - 10)
    const announcementData = {
      title: dto.title,
      content: dto.content,
      scheduleAt: scheduleDate,
      recipientRoles: dto.recipientRoles,
      createdBy: createdBy,
      status: 'SCHEDULED', // Mặc định là Lên lịch
      type: dto.type || 'SYSTEM',
    }

    const newAnnouncement =
      await this.announcementRepository.create(announcementData)

    return this.toResponseDto(newAnnouncement)
  }

  async createAndSendNow(
    dto: CreateAnnouncementDto,
    createdBy: string,
  ): Promise<AnnouncementResponseDto> {
    const now = new Date()
    const announcementData = {
      title: dto.title,
      content: dto.content,
      scheduleAt: now, // Gửi ngay
      recipientRoles: dto.recipientRoles,
      createdBy: createdBy,
      status: 'SENT', // Đánh dấu là đã gửi
      type: dto.type || 'SYSTEM',
    }

    // 1. Lưu Announcement với trạng thái SENT
    const newAnnouncement =
      await this.announcementRepository.create(announcementData)

    // 2. Kích hoạt logic gửi thông báo ngay lập tức
    const recipientRoles = dto.recipientRoles.map((id) => id)

    for (const roleName of recipientRoles) {
      // Gọi Microservice để lấy danh sách User ID
      const userIds = await this.accountServiceClient.getUserIdsByRole(roleName)

      // Tạo và gửi Notification cho từng User
      for (const userId of userIds) {
        const notificationDto: any = {
          // Sử dụng 'any' hoặc import DTO tương ứng
          recipientId: userId,
          recipientRole: roleName,
          title: newAnnouncement.title,
          body: newAnnouncement.content,
          type: NotificationType.ANNOUNCEMENT,
        }
        // Gọi NotificationService để lưu DB và gửi qua WS
        await this.notificationService.createAndSendNotification(
          notificationDto,
        )
      }
    }

    return this.toResponseDto(newAnnouncement)
  }

  async getPendingScheduledAnnouncements(
    currentTime: Date,
  ): Promise<AnnouncementDocument[]> {
    // Lấy Announcement cần gửi
    return this.announcementRepository.findPendingScheduled(currentTime)
  }

  async markAsSent(announcementId: string): Promise<void> {
    // Đánh dấu đã gửi thành công
    await this.announcementRepository.markAsSent(announcementId)
  }

  // Hàm lấy danh sách cho Admin
  async findAll(): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.announcementRepository.findAll()
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return announcements.map(this.toResponseDto)
  }
}
