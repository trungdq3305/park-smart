/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator'

// --- DTO for Request Bodies ---
export class CreateAddressDto {
  @ApiProperty({ example: '29 Lê Duẩn' })
  @IsNotEmpty()
  @IsString()
  fullAddress: string

  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1a' })
  @IsNotEmpty()
  @IsMongoId()
  wardId: string
}

export class UpdateAddressDto {
  @ApiProperty({ example: '30 Nguyễn Huệ', required: false })
  @IsOptional()
  @IsString()
  fullAddress: string

  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1b', required: false })
  @IsOptional()
  @IsMongoId()
  wardId: string
}

// --- DTO for Response (sử dụng với ClassSerializerInterceptor) ---

@Exclude()
class WardInAddressDto {
  @Expose()
  // Khi ở trong WardInAddressDto, `value` chính là `wardId._id`
  @Transform(({ value }) => value.toString())
  _id: string

  @Expose()
  // wardName đã có sẵn, chỉ cần Expose là đủ
  wardName: string
}

@Exclude()
export class AddressResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  fullAddress: string

  @Expose()
  @Type(() => WardInAddressDto)
  wardId: WardInAddressDto

  @Expose()
  latitude: number

  @Expose()
  longitude: number
}
