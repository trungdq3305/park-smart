/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator'
import { IsAfterNow } from 'src/common/decorators/isAfterNow.decorator'
import { IsAfterTime } from 'src/common/decorators/validTime.decorator'

// -----------------------------------------------------------------
// --- DTO for Request Bodies ---
// -----------------------------------------------------------------

export class CreateParkingLotPolicyLinkDto {
  @ApiProperty({
    description: 'ID của bãi đỗ xe (ParkingLot)',
    example: '68e51c5f4745c81c82b61833',
  })
  @IsNotEmpty({ message: 'parkingLotId không được để trống' })
  @IsMongoId({ message: 'parkingLotId phải là một MongoID' })
  parkingLotId: string

  @ApiProperty({
    description: 'ID của chính sách giá (PricingPolicy)',
    example: '68e51c5f4745c81c82b61834',
  })
  @IsNotEmpty({ message: 'pricingPolicyId không được để trống' })
  @IsMongoId({ message: 'pricingPolicyId phải là một MongoID' })
  pricingPolicyId: string

  @ApiPropertyOptional({
    description: 'Độ ưu tiên (số nhỏ hơn ưu tiên cao hơn)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Độ ưu tiên phải là một con số' })
  @Min(0, { message: 'Độ ưu tiên không được âm' })
  priority: number

  @ApiProperty({
    description: 'Ngày bắt đầu hiệu lực (ISO 8601)',
    example: '2025-11-20T00:00:00.000Z',
  })
  @IsNotEmpty({ message: 'startDate không được để trống' })
  @IsDateString(
    {},
    { message: 'startDate phải là định dạng ngày tháng hợp lệ' },
  )
  @IsAfterTime('endDate', {
    message: 'Ngày kết thúc phải lớn hơn ngày bắt đầu.',
  })
  @IsAfterNow({ message: 'Ngày bắt đầu phải là tương lai.' })
  startDate: string

  @ApiProperty({
    description: 'Ngày kết thúc hiệu lực (ISO 8601)',
    example: '2026-11-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate phải là định dạng ngày tháng hợp lệ' })
  endDate: string
}

// Sử dụng PartialType để tạo DTO Cập nhật, tất cả các trường đều là tùy chọn
export class UpdateParkingLotPolicyLinkDto extends PartialType(
  CreateParkingLotPolicyLinkDto,
) {}

// -----------------------------------------------------------------
// --- DTO for Responses ---
// -----------------------------------------------------------------

/**
 * DTO lồng nhau cho ParkingLot (để hiển thị thông tin khi populate)
 */
@Exclude()
class LinkedParkingLotDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  name: string // Giả sử ParkingLot có trường 'name'
}

/**
 * DTO lồng nhau cho PricingPolicy (để hiển thị thông tin khi populate)
 */
@Exclude()
class LinkedPricingPolicyDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  name: string // Giả sử PricingPolicy có trường 'name'
}

/**
 * DTO Phản hồi Chính (Response) cho ParkingLotPolicyLink
 */
@Exclude()
export class ParkingLotPolicyLinkResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  /**
   * Trường parkingLotId đã được populate
   */
  @Expose()
  @Type(() => LinkedParkingLotDto)
  parkingLotId: LinkedParkingLotDto

  /**
   * Trường pricingPolicyId đã được populate
   */
  @Expose()
  @Type(() => LinkedPricingPolicyDto)
  pricingPolicyId: LinkedPricingPolicyDto

  @Expose()
  priority: number

  @Expose()
  startDate: Date // Trả về dạng Date object

  @Expose()
  endDate: Date // Trả về dạng Date object

  // Các trường từ BaseEntity
  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
