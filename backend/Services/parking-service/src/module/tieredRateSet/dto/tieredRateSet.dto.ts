/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

// -----------------------------------------------------------------
// --- DTO for Request Bodies ---
// -----------------------------------------------------------------

/**
 * DTO cho một bậc giá (lồng trong request)
 */
export class CreateTierDto {
  @ApiProperty({ example: '08:00', description: 'Giờ bắt đầu của bậc giá' })
  @IsNotEmpty()
  @IsString()
  fromHour: string

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Giờ kết thúc (null nghĩa là không giới hạn)',
    nullable: true, // Cho phép Swagger hiển thị là có thể null
  })
  @IsOptional()
  @IsString() // @IsOptional sẽ bỏ qua validator này nếu giá trị là null/undefined
  toHour: string | null

  @ApiProperty({ example: 15000, description: 'Giá cho bậc này' })
  @IsNotEmpty()
  @IsNumber()
  price: number
}

/**
 * DTO để tạo mới một TieredRateSet
 */
export class CreateTieredRateSetDto {
  @ApiProperty({ example: 'Bảng giá ngày thường', description: 'Tên bộ giá' })
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty({
    type: [CreateTierDto], // Báo cho Swagger đây là một mảng
    description: 'Danh sách các bậc giá',
  })
  @IsArray()
  @ValidateNested({ each: true }) // Yêu cầu validate từng phần tử trong mảng
  @Type(() => CreateTierDto) // Chỉ định class-transformer dùng DTO nào
  tiers: CreateTierDto[]
}

/**
 * DTO để cập nhật TieredRateSet (tất cả các trường đều là tùy chọn)
 */
export class UpdateTieredRateSetDto extends PartialType(
  CreateTieredRateSetDto,
) {}

// -----------------------------------------------------------------
// --- DTO for Responses ---
// -----------------------------------------------------------------

/**
 * DTO lồng nhau cho Tier (một bậc giá)
 */
@Exclude()
export class TierDto {
  // Schema của bạn có { _id: false } cho Tier,
  // nên chúng ta không expose _id ở đây.

  @Expose()
  fromHour: string

  @Expose()
  toHour: string | null

  @Expose()
  price: number
}

/**
 * DTO Phản hồi Chính cho TieredRateSet
 */
@Exclude()
export class TieredRateSetResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString()) // Tuân thủ template
  _id: string

  @Expose()
  name: string

  /**
   * Mảng này chứa các bậc giá được nhúng
   */
  @Expose()
  @Type(() => TierDto) // Lồng TierDto
  @ValidateNested({ each: true })
  tiers: TierDto[]
}
