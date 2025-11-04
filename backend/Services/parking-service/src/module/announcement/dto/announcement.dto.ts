import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsMongoId,IsNotEmpty, IsOptional } from 'class-validator';

// --- DTO để tạo mới Announcement (Admin gửi lên) ---
export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Tăng Phí Giờ Cao Điểm', description: 'Tiêu đề thông báo' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Phí đỗ xe sẽ tăng 10% vào khung 7h-9h sáng từ 01/12.', description: 'Nội dung thông báo' })
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: ['ADMIN'], description: 'Danh sách Role sẽ nhận thông báo' })
  @IsArray()
  recipientRoles: string[];

  @ApiProperty({ example: '2025-11-10T10:00:00Z', description: 'Thời gian dự kiến xuất bản (ISO 8601)' })
  @IsDateString()
  scheduleAt: string;

  @ApiProperty({ example: 'POLICY_UPDATE', description: 'Loại thông báo', required: false })
  @IsOptional()
  type?: string;
}

// --- DTO phản hồi (Dữ liệu gửi về client) ---
export class AnnouncementResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  status: string;
  
  @ApiProperty()
  scheduleAt: Date;

  @ApiProperty()
  type: string;
  
  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [String], description: 'Danh sách Role nhận thông báo' })
  recipientRoles: string[];
}