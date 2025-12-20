import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform } from 'class-transformer' // Thêm Expose
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator'
// --- DTO để tạo mới Announcement (Admin gửi lên) ---
export class CreateAnnouncementDto {
  @ApiProperty({
    example: 'Tăng Phí Giờ Cao Điểm',
    description: 'Tiêu đề thông báo',
  })
  @IsNotEmpty()
  title: string

  @ApiProperty({
    example: 'Phí đỗ xe sẽ tăng 10% vào khung 7h-9h sáng từ 01/12.',
    description: 'Nội dung thông báo',
  })
  @IsNotEmpty()
  content: string

  @ApiProperty({
    example: ['ADMIN'],
    description: 'Danh sách Role sẽ nhận thông báo',
  })
  @IsArray()
  recipientRoles: string[]

  @ApiProperty({
    example: '2025-11-10T10:00:00Z',
    description: 'Thời gian dự kiến xuất bản theo ngày (ISO 8601)',
  })
  @IsDateString()
  scheduleAt: string

  @ApiProperty({
    example: 'POLICY_UPDATE',
    description: 'Loại thông báo',
    required: false,
  })
  @IsOptional()
  type?: string
}

// --- DTO phản hồi (Dữ liệu gửi về client) ---
export class AnnouncementResponseDto {
  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => obj._id?.toString()) // Chuyển ObjectId thành String nếu cần
  _id: string

  @ApiProperty()
  @Expose()
  title: string

  @ApiProperty()
  @Expose()
  content: string

  @ApiProperty()
  @Expose()
  status: string

  @ApiProperty()
  @Expose()
  scheduleAt: Date

  @ApiProperty()
  @Expose()
  type: string

  @ApiProperty()
  @Expose()
  createdAt: Date

  @ApiProperty({ type: [String] })
  @Expose()
  recipientRoles: string[]
}