/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { CreatePackageRateDto } from 'src/module/packageRate/dto/packageRate.dto'
import { CreateTieredRateSetDto } from 'src/module/tieredRateSet/dto/tieredRateSet.dto'

// --- DTO for Request Bodies ---
export class CreatePricingPolicyDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1a' })
  @IsNotEmpty()
  @IsMongoId()
  basisId: string

  @ApiProperty({
    description: 'Chính sách giá bậc thang',
    example: CreateTieredRateSetDto,
  })
  @IsOptional() // ✅ 1. Giữ lại trường này
  @ValidateNested()
  @Type(() => CreateTieredRateSetDto)
  tieredRateSet: CreateTieredRateSetDto

  @ApiProperty({
    description: 'Chính sách giá gói',
    example: CreatePackageRateDto,
  })
  @IsOptional() // ✅ 1. Giữ lại trường này
  @ValidateNested()
  @Type(() => CreatePackageRateDto)
  packageRate: CreatePackageRateDto

  @ApiProperty({ example: 'Gói theo tháng', description: 'Tên chính sách giá' })
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty({ example: '100000', description: 'Giá theo giờ' })
  @IsOptional()
  @IsNumber()
  pricePerHour: number

  @ApiProperty({
    example: '100000',
    description: 'Giá cố định cho một khoảng thời gian nhất định',
  })
  @IsOptional()
  @IsNumber()
  fixedPrice: number
}

// --- DTO for Responses ---
@Exclude()
export class BasisDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  basisName: string

  @Expose()
  description: string
}
// --- DTO lồng nhau cho PackageRate ---
@Exclude()
export class PackageRateDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  timePackage: string

  @Expose()
  price: number
}

// --- DTO lồng nhau cho TieredRate (một bậc giá) ---
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

// --- DTO lồng nhau cho TieredRateSet (chứa nhiều bậc giá) ---
@Exclude()
export class TieredRateSetDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
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

// --- DTO Phản hồi Chính ---
@Exclude()
export class PricingPolicyResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  name: string

  @Expose()
  pricePerHour: number

  @Expose()
  fixedPrice: number

  /**
   * Trường basisId đã được populate thành đối tượng BasisDto
   */
  @Expose()
  @Type(() => BasisDto)
  basisId: BasisDto

  /**
   * Trường tieredRateSetId đã được populate thành đối tượng TieredRateSetDto
   * (có thể là null nếu đây không phải là chính sách giá bậc thang)
   */
  @Expose()
  @Type(() => TieredRateSetDto)
  tieredRateSetId?: TieredRateSetDto | null

  /**
   * Trường packageRateId đã được populate thành đối tượng PackageRateDto
   * (có thể là null nếu đây không phải là chính sách giá gói)
   */
  @Expose()
  @Type(() => PackageRateDto)
  packageRateId?: PackageRateDto | null
}
