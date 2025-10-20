/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform } from 'class-transformer'
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

// --- DTO for Request Bodies ---
export class CreatePackageRateDto {
  @ApiProperty({ example: 'Gói vé tháng xe máy', description: 'Tên gói giá' })
  @IsNotEmpty()
  @IsString()
  timePackage: string

  @ApiProperty({ example: 1200000, description: 'Giá tiền của gói' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number
}

export class UpdatePackageRateDto {
  @ApiProperty({
    example: 'Gói vé tháng VIP',
    description: 'Tên gói giá',
    required: false,
  })
  @IsOptional()
  @IsString()
  timePackage: string

  @ApiProperty({
    example: 1500000,
    description: 'Giá tiền của gói',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price: number
}

// --- DTO for Response (sử dụng với ClassSerializerInterceptor) ---

@Exclude()
export class PackageRateResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  timePackage: string

  @Expose()
  price: number

  @Expose()
  isUsed: boolean

  // Giả sử BaseEntity của bạn có các trường này
  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
