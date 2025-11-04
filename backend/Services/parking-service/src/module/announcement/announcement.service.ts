import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { AnnouncementResponseDto, CreateAnnouncementDto } from './dto/announcement.dto';
import { IAnnouncementRepository } from './interfaces/iannouncement.repository';
import { IAnnouncementService } from './interfaces/iannouncement.service';
import { AnnouncementDocument } from './schemas/announcement.schema';

@Injectable()
export class AnnouncementService implements IAnnouncementService {
  constructor(
    @Inject(IAnnouncementRepository)
    private readonly announcementRepository: IAnnouncementRepository,
  ) {}

  private toResponseDto(announcement: AnnouncementDocument): AnnouncementResponseDto {
    const plainObject = announcement.toJSON() as any; // Chuyển sang plain object để dễ dàng chuyển đổi
    return plainToInstance(AnnouncementResponseDto, plainObject, {
      excludeExtraneousValues: true,
    });
  }

  async create(
    dto: CreateAnnouncementDto,
    createdBy: string,
  ): Promise<AnnouncementResponseDto> {
    const announcementData = {
      title: dto.title,
      content: dto.content,
      scheduleAt: new Date(dto.scheduleAt),
      recipientRoles: dto.recipientRoles,
      createdBy: createdBy,
      status: 'SCHEDULED', // Mặc định là Lên lịch
      type: dto.type || 'SYSTEM',
    };

    const newAnnouncement = await this.announcementRepository.create(announcementData);

    return this.toResponseDto(newAnnouncement);
  }

  async getPendingScheduledAnnouncements(currentTime: Date): Promise<AnnouncementDocument[]> {
    // Lấy Announcement cần gửi
    return this.announcementRepository.findPendingScheduled(currentTime);
  }

  async markAsSent(announcementId: string): Promise<void> {
    // Đánh dấu đã gửi thành công
    await this.announcementRepository.markAsSent(announcementId);
  }
  
  // Hàm lấy danh sách cho Admin
  async findAll(): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.announcementRepository.findAll();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return announcements.map(this.toResponseDto);
  }
}