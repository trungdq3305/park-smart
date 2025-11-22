import type {
  AnnouncementResponseDto,
  CreateAnnouncementDto,
} from '../dto/announcement.dto'
import type { AnnouncementDocument } from '../schemas/announcement.schema'

export interface IAnnouncementService {
  findAll(): unknown
  // Admin tạo thông báo
  create(
    dto: CreateAnnouncementDto,
    createdBy: string,
  ): Promise<AnnouncementResponseDto>
  createAndSendNow(
    dto: CreateAnnouncementDto,
    createdBy: string,
  ): Promise<AnnouncementResponseDto>
  // Lấy danh sách Announcement đang chờ xử lý (dùng cho Cron Job)
  getPendingScheduledAnnouncements(
    currentTime: Date,
  ): Promise<AnnouncementDocument[]>

  // Đánh dấu Announcement đã được gửi (dùng cho Cron Job)
  markAsSent(announcementId: string): Promise<void>

  // Các hàm khác: getById, update, delete (nếu cần)
}

export const IAnnouncementService = Symbol('IAnnouncementService')
