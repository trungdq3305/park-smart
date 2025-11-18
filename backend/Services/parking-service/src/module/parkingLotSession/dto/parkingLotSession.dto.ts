/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// -----------------------------------------------------------------
// --- DTO for Request Bodies (Yêu cầu) ---
// -----------------------------------------------------------------

/**
 * DTO cho việc tạo một Phiên đỗ xe mới (Check-in).
 * Dùng cho Kiosk khi xe Vãng lai (Xô 3) vào.
 * File ảnh sẽ được gửi riêng (multipart-form-data).
 */

export class CheckInDto {
  @ApiPropertyOptional({
    description:
      'Biển số xe (từ OCR hoặc nhập tay). Bắt buộc nếu là khách vãng lai.',
    example: '51A-123.46',
  })
  @IsOptional()
  @IsString({ message: 'Biển số xe phải là chuỗi ký tự' })
  plateNumber?: string

  @ApiPropertyOptional({
    description: 'Mã định danh từ QR Code (nếu quét được).',
    example: '5349b4ddd-27e6-4722-91b1-8d874514031e',
  })
  @IsOptional()
  @IsString({ message: 'Mã định danh phải là chuỗi ký tự' })
  identifier?: string // Là reservationIdentifier hoặc subscriptionIdentifier

  @ApiPropertyOptional({
    description: 'Mô tả tùy chọn (ví dụ: "Check-in tại cổng A")',
    example: 'Cổng vào số 1',
  })
  @IsOptional()
  @IsString()
  description?: string
}

export class CreateParkingSessionDto {
  @ApiProperty({
    description: 'Biển số xe (đã được xác nhận sau khi OCR/nhập tay)',
    example: '51A-123.46',
  })
  @IsNotEmpty({ message: 'Biển số xe không được để trống' })
  @IsString({ message: 'Biển số xe phải là một chuỗi' })
  plateNumber: string

  @ApiPropertyOptional({
    description: 'Mô tả tùy chọn cho hình ảnh (ví dụ: "Ảnh lúc vào")',
    example: 'Ảnh xe X lúc vào',
  })
  @IsOptional()
  @IsString()
  description?: string

  // Lưu ý: parkingLotId sẽ được lấy từ @Param(':parkingLotId') trong controller.
}

// -----------------------------------------------------------------
// --- DTO for Responses (Phản hồi) ---
// -----------------------------------------------------------------

/**
 * DTO lồng nhau đơn giản cho ParkingLot
 */
@Exclude()
class ParkingLotSimpleDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  name: string // Giả sử ParkingLot có 'name'
}

/**
 * DTO lồng nhau đơn giản cho User
 */
@Exclude()
class UserSimpleDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  fullName: string // Giả sử User có 'fullName'
}

/**
 * DTO lồng nhau đơn giản cho Reservation (Xô 2)
 */
@Exclude()
class ReservationSimpleDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  reservationIdentifier: string // Mã QR
}

/**
 * DTO lồng nhau đơn giản cho Subscription (Xô 1)
 */
@Exclude()
class SubscriptionSimpleDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  subscriptionIdentifier: string // Mã QR
}

/**
 * DTO Phản hồi Chính cho ParkingLotSession
 * (Sử dụng với ClassSerializerInterceptor)
 */
@Exclude()
export class ParkingLotSessionResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Type(() => ParkingLotSimpleDto)
  parkingLotId: ParkingLotSimpleDto // ⭐️ Đã populate

  @Expose()
  @Type(() => UserSimpleDto)
  userId: UserSimpleDto | null // ⭐️ Đã populate (có thể null)

  @Expose()
  @Type(() => ReservationSimpleDto)
  reservationId: ReservationSimpleDto | null // ⭐️ Liên kết Xô 2

  @Expose()
  @Type(() => SubscriptionSimpleDto)
  subscriptionId: SubscriptionSimpleDto | null // ⭐️ Liên kết Xô 1

  // (Nếu cả 2 'Id' trên đều null -> Đây là Xô 3 Vãng lai)

  @Expose()
  plateNumber: string

  @Expose()
  checkInTime: Date // Thời gian THỰC TẾ xe vào

  @Expose()
  checkOutTime: Date | null // Thời gian THỰC TẾ xe ra

  @Expose()
  status: string // ⭐️ Trạng thái (ACTIVE, COMPLETED)

  @Expose()
  paymentStatus: string // ⭐️ Trạng thái (PENDING, PAID, PREPAID...)

  @Expose()
  amountPaid: number // Tiền đã trả (cho Xô 3 hoặc phụ thu Xô 2)

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
