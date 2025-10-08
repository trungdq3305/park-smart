/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator'

// ===================================================================================
// DTOs for REQUEST BODY
// ===================================================================================

export class CreateVehicleDto {
  @ApiProperty({ example: '51AB12345' })
  @IsNotEmpty({ message: 'Biển số xe không được để trống' })
  @IsString()
  @Matches(/^\d{2}[A-Z]{1,2}\d{4,5}$/, {
    message: 'Biển số xe không đúng định dạng. Ví dụ: 51F12345 hoặc 51AB12345',
  })
  plateNumber: string

  @ApiProperty({ example: '650f1f4e8c3a3c1a1c8b4567' })
  @IsMongoId({ message: 'Mã màu không hợp lệ' })
  @IsNotEmpty({ message: 'Mã màu không được để trống' })
  colorId: string

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: 'Loại xe không được để trống' })
  @IsBoolean({ message: 'Loại xe phải là true hoặc false' })
  isElectricCar: boolean

  @ApiProperty({ example: '650f1f4e8c3a3c1a1c8b4568' })
  @IsMongoId({ message: 'Mã hãng xe không hợp lệ' })
  @IsNotEmpty({ message: 'Mã hãng xe không được để trống' })
  brandId: string
}

export class UpdateVehicleDto {
  @ApiProperty({ example: '650f1f4e8c3a3c1a1c8b4567', required: false })
  @IsMongoId({ message: 'Mã màu không hợp lệ' })
  colorId: string

  @ApiProperty({ example: true })
  @IsNotEmpty({ message: 'Loại xe không được để trống' })
  @IsBoolean({ message: 'Loại xe phải là true hoặc false' })
  isElectricCar: boolean

  @ApiProperty({ example: '650f1f4e8c3a3c1a1c8b4568', required: false })
  @IsMongoId({ message: 'Mã hãng xe không hợp lệ' })
  brandId: string
}

// ===================================================================================
// DTOs for URL PARAMETERS
// ===================================================================================

export class VehicleIdParamDto {
  @IsMongoId({ message: 'ID xe không hợp lệ' })
  id: string
}

export class PlateParamDto {
  @IsNotEmpty({ message: 'Biển số xe không được để trống' })
  @IsString()
  @Matches(/^\d{2}[A-Z]{1,2}\d{4,5}$/, {
    message: 'Biển số xe không đúng định dạng. Ví dụ: 51F12345 hoặc 51AB12345',
  })
  plateNumber: string
}

// ===================================================================================
// DTO for RESPONSE (Dùng với ClassSerializerInterceptor)
// ===================================================================================

// Các DTO lồng nhau cho các trường được populate
@Exclude()
class ColorInVehicleDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Transform(({ obj }) => obj.colorName)
  colorName: string
}

@Exclude()
class BrandInVehicleDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Transform(({ obj }) => obj.brandName)
  brandName: string
}

@Exclude()
export class VehicleResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  plateNumber: string

  @Expose()
  driverId: string

  @Expose()
  @Type(() => ColorInVehicleDto)
  colorId: ColorInVehicleDto

  @Expose()
  @Type(() => BrandInVehicleDto)
  brandId: BrandInVehicleDto

  @Expose()
  isElectricCar: boolean
}
