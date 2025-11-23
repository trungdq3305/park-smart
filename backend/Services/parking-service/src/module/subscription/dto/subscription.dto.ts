/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator'

import { SubscriptionStatusEnum } from '../enums/subscription.enum'

// -----------------------------------------------------------------
// --- DTO for Request Bodies ---
// -----------------------------------------------------------------

/**
 * DTO cho hành động "Mua" (Tạo) một Gói Thuê Bao (Subscription).
 * Đây là những gì client gửi lên.
 */
export class CreateSubscriptionDto {
  @ApiProperty({
    example: '605e3f5f4f3e8c1d4c9f1e1a',
    description: 'ID của bãi đỗ xe (ParkingLot) muốn mua gói',
  })
  @IsMongoId({ message: 'ID bãi đỗ xe phải là một MongoID hợp lệ' })
  @IsNotEmpty({ message: 'ID bãi đỗ xe không được để trống' })
  parkingLotId: string

  @ApiProperty({
    example: '605e3f5f4f3e8c1d4c9f1e1b',
    description: 'ID của chính sách giá (PricingPolicy) đang mua',
  })
  @IsMongoId({ message: 'ID chính sách giá phải là một MongoID hợp lệ' })
  @IsNotEmpty({ message: 'ID chính sách giá không được để trống' })
  pricingPolicyId: string

  @ApiProperty({
    example: '2025-11-10T00:00:00.000Z',
    description: 'Ngày mong muốn bắt đầu gói (định dạng ISO 8601)',
  })
  @IsDateString(
    {},
    { message: 'Ngày bắt đầu phải là định dạng ngày tháng hợp lệ' },
  )
  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  startDate: string

  // Lưu ý: userId sẽ được lấy từ @GetCurrentUserId() trong controller.
  // endDate, status, isUsed, subscriptionIdentifier sẽ được set bởi server.
}

export class UpdatePaymentDto {
  @ApiProperty({
    example: '605e3f5f4f3e8c1d4c9f1e1b',
    description:
      'Mã định danh thanh toán từ hệ thống thanh toán bên thứ ba (paymentId)',
  })
  @IsNotEmpty({ message: 'paymentId không được để trống' })
  paymentId: string
}

/**
 * DTO cho Admin cập nhật một Gói Thuê Bao (Subscription).
 */
export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Cập nhật ngày hết hạn (ví dụ: gia hạn)',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Ngày hết hạn phải là định dạng ngày tháng hợp lệ' },
  )
  endDate: string

  @ApiPropertyOptional({
    example: 'CANCELLED',
    enum: SubscriptionStatusEnum,
    description: 'Cập nhật trạng thái (ví dụ: Hủy gói)',
  })
  @IsOptional()
  @IsEnum(SubscriptionStatusEnum, {
    message: 'Trạng thái phải là ACTIVE, EXPIRED, hoặc CANCELLED',
  })
  status: SubscriptionStatusEnum
}

// -----------------------------------------------------------------
// --- DTO for Responses ---
// -----------------------------------------------------------------

/**
 * DTO lồng nhau cho PricingPolicy (để hiển thị thông tin gói đã mua)
 */
@Exclude()
export class SubscribedPolicyDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  name: string // Tên chính sách giá, ví dụ "Gói 1 tháng"
}

/**
 * DTO Phản hồi Chính (Response) cho Subscription
 * (Sử dụng với ClassSerializerInterceptor)
 */
@Exclude()
class ParkingLotSimpleDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  name: string
}

@Exclude()
export class SubscriptionDetailResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Type(() => ParkingLotSimpleDto)
  parkingLotId: ParkingLotSimpleDto

  /**
   * Trường pricingPolicyId đã được populate (lồng nhau)
   */
  @Expose()
  @Type(() => SubscribedPolicyDto) // Lồng DTO
  pricingPolicyId: SubscribedPolicyDto

  @Expose()
  status: string

  @Expose()
  startDate: Date

  @Expose()
  endDate: Date // ⭐️ Trường này do server tính toán và trả về

  @Expose()
  isUsed: boolean // ⭐️ Trạng thái "đang có xe ở bãi"

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Expose()
  subscriptionIdentifier: string // Mã QR hoặc mã định danh gói
}

export class AvailabilitySlotDto {
  // ⭐️ Sửa: Đảm bảo 'export'
  @ApiProperty({
    description: 'Số suất còn lại',
    example: 5,
  })
  remaining: number

  @ApiProperty({
    description: 'Có thể đặt không (remaining > 0)',
    example: true,
  })
  isAvailable: boolean
}

@Exclude()
export class SubscriptionLogDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  transactionType: string

  @Expose()
  extendedUntil: number
}

@Exclude()
export class SubscriptionIdResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string
}

export class SubscriptionRenewalEligibilityResponseDto {
  canRenew: boolean
  message?: string
}
