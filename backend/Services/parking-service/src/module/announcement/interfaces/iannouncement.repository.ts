import type { AnnouncementDocument } from '../schemas/announcement.schema';

export interface IAnnouncementRepository {
  // Tạo một bản ghi Announcement mới
  create(data: any): Promise<AnnouncementDocument>; 
  
  // Lấy danh sách các Announcement đã lên lịch và chưa được gửi
  findPendingScheduled(currentTime: Date): Promise<AnnouncementDocument[]>;
  
  // Cập nhật trạng thái và thời gian gửi của Announcement
  markAsSent(announcementId: string): Promise<void>;
  
  // Lấy tất cả Announcement (cho trang Admin)
  findAll(): Promise<AnnouncementDocument[]>; 
}

export const IAnnouncementRepository = Symbol('IAnnouncementRepository');