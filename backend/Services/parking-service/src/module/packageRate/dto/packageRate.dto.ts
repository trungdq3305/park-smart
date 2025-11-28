/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'

import { Unit } from '../enums/packageRate.enum'

// --- DTO for Request Bodies ---
export class CreatePackageRateDto {
  @ApiProperty({ example: 'Gói vé tháng xe máy', description: 'Tên gói giá' })
  @IsString()
  @IsNotEmpty({ message: 'Tên gói cước không được để trống' }) // <-- Lỗi tiếng Việt
  name: string // <-- Sửa từ timePackage

  @ApiProperty({ example: 1200000, description: 'Giá tiền của gói' })
  @IsNumber({}, { message: 'Giá cước phải là một con số' }) // <-- Lỗi tiếng Việt
  @Min(0, { message: 'Giá cước không được âm' })
  @IsNotEmpty({ message: 'Giá cước không được để trống' })
  price: number

  @ApiProperty({
    example: 1,
    description: 'Thời hạn của gói (ví dụ: 1 tháng, 3 giờ)',
  })
  @IsNumber({}, { message: 'Thời hạn phải là một con số' })
  @IsNotEmpty({ message: 'Thời hạn không được để trống' }) // <-- Lỗi tiếng Việt
  durationAmount: number

  @ApiProperty({
    example: 'MONTH',
    enum: Unit,
    description: 'Đơn vị thời hạn',
  })
  @IsEnum(Unit, {
    message: 'Đơn vị thời hạn phải là "HOUR", "DAY", hoặc "MONTH"', // <-- Lỗi tiếng Việt
  })
  @IsNotEmpty({ message: 'Đơn vị thời hạn không được để trống' })
  unit: Unit
}

export class UpdatePackageRateDto {
  @ApiProperty({ example: 'Gói vé tháng xe máy', description: 'Tên gói giá' })
  @IsString()
  @IsNotEmpty({ message: 'Tên gói cước không được để trống' }) // <-- Lỗi tiếng Việt
  name: string // <-- Sửa từ timePackage

  @ApiProperty({ example: 1200000, description: 'Giá tiền của gói' })
  @IsNumber({}, { message: 'Giá cước phải là một con số' }) // <-- Lỗi tiếng Việt
  @Min(0, { message: 'Giá cước không được âm' })
  @IsNotEmpty({ message: 'Giá cước không được để trống' })
  price: number

  @ApiProperty({
    example: 1,
    description: 'Thời hạn của gói (ví dụ: 1 tháng, 3 giờ)',
  })
  @IsNumber({}, { message: 'Thời hạn phải là một con số' })
  @IsNotEmpty({ message: 'Thời hạn không được để trống' }) // <-- Lỗi tiếng Việt
  durationAmount: number

  @ApiProperty({
    example: 'MONTH',
    enum: Unit,
    description: 'Đơn vị thời hạn',
  })
  @IsEnum(Unit, {
    message: 'Đơn vị thời hạn phải là "HOUR", "DAY", hoặc "MONTH"', // <-- Lỗi tiếng Việt
  })
  @IsNotEmpty({ message: 'Đơn vị thời hạn không được để trống' })
  unit: Unit
}

// --- DTO for Response (sử dụng với ClassSerializerInterceptor) ---

@Exclude()
export class PackageRateResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  name: string // <-- Thay thế cho timePackage

  @Expose()
  price: number

  @Expose()
  durationAmount: number // <-- Bổ sung

  @Expose()
  unit: string // <-- Bổ sung (Hoặc là DurationUnitEnum nếu bạn dùng)

  @Expose()
  isUsed: boolean

  // Giả sử BaseEntity của bạn có các trường này
  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}
