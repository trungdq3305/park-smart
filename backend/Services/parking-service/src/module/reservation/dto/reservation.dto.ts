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
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { IsAfterNow } from 'src/common/decorators/isAfterNow.decorator'
import { IsAfterTime } from 'src/common/decorators/validTime.decorator'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

// (Giả định Enum này đã được cập nhật để bao gồm PENDING_PAYMENT)
import { ReservationStatusEnum } from '../enums/reservation.enum'

// -----------------------------------------------------------------
// --- DTO for Request Bodies ---
// -----------------------------------------------------------------

/**
 * DTO cho hành động "Tạo bản nháp" (Tạo) một Đơn đặt chỗ (Reservation).
 * Đây là những gì client gửi lên (API 1: POST).
 */
export class CreateReservationDto {
  @ApiProperty({
    example: '605e3f5f4f3e8c1d4c9f1e1a',
    description: 'ID của bãi đỗ xe (ParkingLot) muốn đặt',
  })
  @IsMongoId({ message: 'ID bãi đỗ xe phải là một MongoID hợp lệ' })
  @IsNotEmpty({ message: 'ID bãi đỗ xe không được để trống' })
  parkingLotId: string

  @ApiProperty({
    example: '605e3f5f4f3e8c1d4c9f1e1b',
    description: 'ID của chính sách giá (PricingPolicy) đang đặt',
  })
  @IsMongoId({ message: 'ID chính sách giá phải là một MongoID hợp lệ' })
  @IsNotEmpty({ message: 'ID chính sách giá không được để trống' })
  pricingPolicyId: string

  @ApiPropertyOptional({
    example: '605e3f5f4f3e8c1d4c9f1e1c',
    description: 'ID của Khuyến mãi (Promotion) nếu có',
  })
  @IsOptional()
  @IsMongoId({ message: 'ID khuyến mãi phải là một MongoID hợp lệ' })
  promotionId: string

  @ApiProperty({
    example: '2025-11-10T09:15:00.000Z',
    description: 'Thời gian mong muốn đến (định dạng ISO 8601)',
  })
  @IsDateString(
    {},
    { message: 'Thời gian đến phải là định dạng ngày tháng hợp lệ' },
  )
  @IsAfterNow({ message: 'Thời gian đến phải là trong tương lai' })
  @IsNotEmpty({ message: 'Thời gian đến không được để trống' })
  // ⭐️ (Nên thêm @IsAfterNow như đã bàn)
  userExpectedTime: string

  // ⭐️ BỔ SUNG TRƯỜNG NÀY ⭐️
  @ApiProperty({
    example: '2025-11-10T11:00:00.000Z',
    description: 'Thời gian dự kiến rời đi (ISO 8601)',
  })
  @IsDateString(
    {},
    { message: 'Thời gian kết thúc phải là định dạng ngày tháng hợp lệ' },
  )
  @IsNotEmpty({ message: 'Thời gian kết thúc không được để trống' })
  @IsAfterTime('userExpectedTime', {
    message: 'Thời gian kết thúc phải sau thời gian đến',
  })
  estimatedEndTime: string

  // ⭐️ Lưu ý: prepaidAmount, inventoryTimeSlot, status, v.v.
  // sẽ do server tính toán và thiết lập.
}

/**
 * DTO cho hành động "Kích hoạt" (Confirm) một Đơn đặt chỗ.
 * Đây là những gì client gửi lên (API 2: PATCH).
 */
export class ConfirmReservationPaymentDto {
  @ApiProperty({
    example: '605e3f5f4f3e8c1d4c9f1e1c',
    description: 'Mã định danh thanh toán từ hệ thống .NET (paymentId)',
  })
  @IsNotEmpty({ message: 'paymentId không được để trống' })
  paymentId: string
}

/**
 * DTO cho Admin cập nhật một Đơn đặt chỗ (Reservation).
 */
export class UpdateReservationStatusDto {
  @ApiPropertyOptional({
    example: 'CANCELLED_BY_OPERATOR',
    enum: ReservationStatusEnum,
    description: 'Cập nhật trạng thái (ví dụ: Hủy vé)',
  })
  @IsOptional()
  @IsEnum(ReservationStatusEnum, {
    message: 'Trạng thái không hợp lệ',
  })
  status: ReservationStatusEnum
}

// -----------------------------------------------------------------
// --- DTO for Responses ---
// -----------------------------------------------------------------

/**
 * DTO lồng nhau cho ParkingLot (để hiển thị)
 */
@Exclude()
class LinkedBasisDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  basisName: string

  @Expose()
  description: string
}

@Exclude()
class LinkedPackageRateDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  name: string

  @Expose()
  price: number

  @Expose()
  durationAmount: number

  @Expose()
  unit: string
}

/**
 * DTO cho 'TieredRateSet' (Bộ giá bậc thang)
 */
@Exclude()
class TierDto {
  @Expose()
  fromHour: string

  @Expose()
  toHour: string | null

  @Expose()
  price: number
}

@Exclude()
class LinkedTieredRateSetDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  name: string

  @Expose()
  @Type(() => TierDto) // ⭐️ Lồng mảng DTO 'Tier' vào đây
  tiers: TierDto[]
}

@Exclude()
export class SubscribedPolicyDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  name: string // Tên chính sách giá, ví dụ "Gói 1 tháng"

  // --- Các trường giá trị trực tiếp ---
  @Expose()
  pricePerHour: number

  @Expose()
  fixedPrice: number

  // --- Các trường populate (lồng nhau) ---

  @Expose()
  @Type(() => LinkedBasisDto) // ⭐️ Bổ sung
  basisId: LinkedBasisDto

  @Expose()
  @Type(() => LinkedPackageRateDto) // ⭐️ Bổ sung
  packageRateId: LinkedPackageRateDto | null // Có thể null

  @Expose()
  @Type(() => LinkedTieredRateSetDto) // ⭐️ Bổ sung
  tieredRateSetId: LinkedTieredRateSetDto | null // Có thể null
}
@Exclude()
class ReservedParkingLotDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  name: string // Giả sử ParkingLot có 'name'

  @Expose()
  parkingLotOperatorId: string
}

/**
 * DTO lồng nhau cho PricingPolicy (để hiển thị)
 */
@Exclude()
class ReservedPolicyDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  name: string // Tên chính sách giá

  // --- Các trường giá trị trực tiếp ---
  @Expose()
  pricePerHour: number

  @Expose()
  fixedPrice: number

  // --- Các trường populate (lồng nhau) ---

  @Expose()
  @Type(() => LinkedBasisDto) // ⭐️ Bổ sung
  basisId: LinkedBasisDto

  @Expose()
  @Type(() => LinkedPackageRateDto) // ⭐️ Bổ sung
  packageRateId: LinkedPackageRateDto | null // Có thể null

  @Expose()
  @Type(() => LinkedTieredRateSetDto) // ⭐️ Bổ sung
  tieredRateSetId: LinkedTieredRateSetDto | null // Có thể null
}

/**
 * DTO Phản hồi Chính (Response) cho Reservation
 * (Sử dụng với ClassSerializerInterceptor)
 */
@Exclude()
export class ReservationDetailResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Type(() => ReservedParkingLotDto)
  parkingLotId: ReservedParkingLotDto

  @Expose()
  @Type(() => ReservedPolicyDto) // Lồng DTO
  pricingPolicyId: ReservedPolicyDto

  @Expose()
  @Transform(({ obj }) => obj.promotionId?.toString() ?? null)
  promotionId: string | null

  @Expose()
  inventoryTimeSlot: Date // Khung giờ chuẩn (9:00)

  @Expose()
  userExpectedTime: Date // Giờ khách chọn (9:15)

  @Expose()
  estimatedEndTime: Date

  @Expose()
  prepaidAmount: number // Số tiền đã trả trước

  @Expose()
  status: string // (CONFIRMED, PENDING_PAYMENT, v.v.)

  @Expose()
  paymentId: string | null // (null nếu là PENDING_PAYMENT)

  @Expose()
  reservationIdentifier: string // Mã QR

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}

export class ReservationAvailabilitySlotDto {
  @ApiProperty({
    description: 'Số suất đặt trước còn lại trong khung giờ này',
    example: 25,
  })
  remaining: number

  @ApiProperty({
    description: 'Có thể đặt không (remaining > 0)',
    example: true,
  })
  isAvailable: boolean
}

export class ExtendReservationDto {
  @ApiProperty({ description: 'Số giờ muốn gia hạn thêm', example: 1 })
  @IsNumber()
  @Min(0.5)
  additionalHours: number

  @ApiProperty({
    description: 'Mã giao dịch thanh toán cho phần gia hạn',
    example: 'PAY_EXT_123',
  })
  @IsString()
  @IsNotEmpty()
  paymentId: string
}

export class ReservationExtensionEligibilityResponseDto {
  @ApiProperty()
  canExtend: boolean

  @ApiProperty()
  newEndTime: Date

  @ApiProperty({ description: 'Số tiền cần thanh toán thêm' })
  additionalCost: number

  @ApiPropertyOptional({
    description: 'Lý do không thể gia hạn (nếu canExtend=false)',
  })
  reason?: string
}

export class CheckExtensionBodyDto {
  @ApiProperty({
    description: 'Số giờ muốn gia hạn thêm (tối thiểu 0.5 giờ)',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @Min(0.5, { message: 'Thời gian gia hạn tối thiểu là 30 phút (0.5)' })
  additionalHours: number

  @ApiProperty({
    description: 'Số tiền dự kiến phải thanh toán cho phần gia hạn',
    example: 100000,
    type: Number,
  })
  @IsNumber()
  additionalCost: number
}

/**
 * DTO dùng cho Bước 2: Xác nhận gia hạn kèm Payment ID
 * (Kế thừa từ CheckExtensionBodyDto nên đã có sẵn additionalHours)
 */

export class ReservationFilterDto extends PaginationQueryDto {
  @ApiProperty({
    enum: ReservationStatusEnum,
    description: 'Lọc theo trạng thái đơn đặt chỗ',
    example: ReservationStatusEnum.CONFIRMED,
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(ReservationStatusEnum)
  status: ReservationStatusEnum
}

export class ReservationCancellationPreviewResponseDto {
  @ApiProperty({ description: 'Có được phép hủy không', example: true })
  canCancel: boolean

  @ApiProperty({ description: 'Số tiền sẽ được hoàn lại', example: 50000 })
  refundAmount: number

  @ApiProperty({
    description: 'Thời gian còn lại đến giờ đặt (phút)',
    example: 75,
  })
  minutesUntilStart: number

  @ApiProperty({ description: 'Thông báo/Cảnh báo cho người dùng' })
  warningMessage: string
}
