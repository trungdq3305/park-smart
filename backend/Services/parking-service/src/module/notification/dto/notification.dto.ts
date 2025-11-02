// src/module/notification/dto/notification.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform } from 'class-transformer'
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import {
  NotificationRole,
  NotificationType,
} from 'src/common/constants/notification.constant'

// --- Internal DTO (Dùng để Service gọi) ---
export class CreateNotificationInternalDto {
  @IsNotEmpty()
  @IsMongoId()
  recipientId: string

  @IsNotEmpty()
  @IsEnum(NotificationRole)
  recipientRole: NotificationRole

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType

  @IsNotEmpty()
  @IsString()
  title: string

  @IsNotEmpty()
  @IsString()
  body: string

  @IsOptional()
  @IsObject()
  data?: Record<string, any>
}

// --- API DTO (Dùng cho Controller/Request Body) ---
// Không cần recipientId vì API này là API nội bộ được bảo vệ bởi Admin
export class CreateNotificationDto {
    @ApiProperty({
        description: 'ID người dùng/đối tượng nhận thông báo (VD: ID của Driver, Operator, Admin)',
        example: '68bf1bfa63547daf59667800',
    })
    @IsNotEmpty()
    @IsMongoId()
    recipientId: string

    @ApiProperty({ enum: NotificationRole, description: 'Vai trò của người nhận thông báo', example: 'ADMIN'})
    @IsNotEmpty()
    @IsEnum(NotificationRole)
    recipientRole: NotificationRole

    @ApiProperty({ enum: NotificationType, description: 'Loại thông báo (dùng để phân loại trên FE)' })
    @IsNotEmpty()
    @IsEnum(NotificationType)
    type: NotificationType

    @ApiProperty({ description: 'Tiêu đề thông báo', example: 'Thông báo Quan trọng' })
    @IsNotEmpty()
    @IsString()
    title: string

    @ApiProperty({ description: 'Nội dung chi tiết của thông báo', example: 'Hệ thống sẽ bảo trì vào 2h sáng mai.' })
    @IsNotEmpty()
    @IsString()
    body: string

    @ApiProperty({
        description: 'Dữ liệu bổ sung (metadata) đính kèm',
        required: false,
        example: { bookingId: 'someMongoId' },
    })
    @IsOptional()
    @IsObject()
    data?: Record<string, any>
}


// --- Response DTO (Dùng cho cả RESTful và WebSocket) ---
@Exclude()
export class NotificationResponseDto {
// ... (Phần còn lại giữ nguyên) ...
  @Expose()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @ApiProperty({ enum: NotificationRole })
  recipientRole: NotificationRole

  @Expose()
  @ApiProperty({ enum: NotificationType })
  type: NotificationType

  @Expose()
  title: string

  @Expose()
  body: string

  @Expose()
  data: Record<string, any>

  @Expose()
  isRead: boolean

  @Expose()
  createdAt: Date
}