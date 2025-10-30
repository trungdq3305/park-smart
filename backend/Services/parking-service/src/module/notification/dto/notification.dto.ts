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

// --- Response DTO (Dùng cho cả RESTful và WebSocket) ---
@Exclude()
export class NotificationResponseDto {
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