/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

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

  @ApiPropertyOptional({
    description: 'UID của thẻ NFC (nếu quét được).',
    example: '04A224B67C5280',
  })
  @IsOptional()
  @IsString()
  nfcUid?: string // UID thẻ NFC nếu có quét được

  @ApiProperty({
    description: 'File ảnh chụp biển số xe (Snapshot)',
    type: 'string',
    format: 'binary', // 👈 Quan trọng: Đánh dấu là file binary
  })
  file: any
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
export class GuestCardResponseDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  nfcUid: string

  @Expose()
  code: string
}

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
  amountPayAfterCheckOut: number | null // Tiền phải trả sau khi check-out

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Expose()
  @Type(() => GuestCardResponseDto)
  guestCardId: GuestCardResponseDto | null // ⭐️ Đã populate nếu có liên kết thẻ
}

export class HistoryFilterDto {
  @ApiProperty({
    description: 'Ngày bắt đầu (ISO 8601)',
    example: new Date().toISOString(),
    type: String,
  })
  @IsDateString() // Tự động validate format ngày
  startDate: string

  @ApiProperty({
    description: 'Ngày kết thúc (ISO 8601)',
    example: new Date().toISOString(),
    type: String,
  })
  @IsDateString()
  endDate: string
}

export class GetHistorySessionDto extends IntersectionType(
  PaginationQueryDto,
  HistoryFilterDto,
) {}

export class ConfirmCheckoutDto {
  @ApiPropertyOptional({
    description: 'ID giao dịch thanh toán (nếu có)',
    example: 'TXN_123456',
  })
  @IsOptional()
  @IsString()
  paymentId?: string

  @ApiPropertyOptional({
    description: 'ID chính sách giá áp dụng',
    example: '6910...',
  })
  @IsOptional()
  @IsString()
  pricingPolicyId?: string

  @ApiPropertyOptional({
    description: 'Số tiền thanh toán (sẽ tự ép kiểu từ chuỗi sang số)',
    example: 50000,
    type: Number,
  })
  @Type(() => Number) // 👈 QUAN TRỌNG: Tự động chuyển chuỗi "50000" -> số 50000
  @IsNumber()
  amountPayAfterCheckOut: number

  @ApiPropertyOptional({
    description: 'File ảnh chứng từ thanh toán (nếu có)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  file: any

  @ApiPropertyOptional({
    description: 'Ghi chú tùy chọn khi checkout',
    example: 'Khách làm mất thẻ',
  })
  @IsOptional()
  @IsString()
  note?: string
}
