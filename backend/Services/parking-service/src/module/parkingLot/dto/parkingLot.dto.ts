/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, PartialType } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MinDate,
} from 'class-validator'
import { IsAfterTime } from 'src/common/decorators/validTime.decorator'

import { RequestStatus } from '../enums/parkingLot.enum'

// =================================================================
// == DTOs for Creating the MAIN ParkingLot Entity
// =================================================================

// =================================================================
// == Utility & Geospatial DTOs (Giữ nguyên)
// =================================================================

export class CoordinatesDto {
  @ApiProperty({ example: 10.762622 })
  @IsNotEmpty({ message: 'Latitude không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude phải là một số' })
  @IsLatitude()
  latitude: number

  @ApiProperty({ example: 106.660172 })
  @IsNotEmpty({ message: 'Longitude không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude phải là một số' })
  @IsLongitude()
  longitude: number
}

export class BoundingBoxDto {
  @IsLongitude()
  @Type(() => Number)
  bottomLeftLng: number

  @IsLatitude()
  @Type(() => Number)
  bottomLeftLat: number

  @IsLongitude()
  @Type(() => Number)
  topRightLng: number

  @IsLatitude()
  @Type(() => Number)
  topRightLat: number
}

@Exclude()
export class AddressDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  latitude: number

  @Expose()
  longitude: number

  @Expose()
  @Transform(({ obj }) => obj.fullAddress) // Giả sử fullAddress đã đầy đủ
  fullAddress: string

  @Expose()
  wardId: any
}
export class CreateParkingLotDto {
  @ApiProperty({ example: '650f1f4e8c3a3c1a1c8b4567' })
  @IsMongoId({ message: 'Mã địa chỉ không hợp lệ' })
  @IsNotEmpty({ message: 'Mã địa chỉ không được để trống' })
  addressId: string

  @ApiProperty({ example: '08:00' })
  @IsString({ message: 'openTime phải có định dạng HH:MM' })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'openTime phải có định dạng HH:MM',
  })
  openTime: string

  @ApiProperty({ example: '17:00' })
  @IsString({ message: 'closeTime phải có định dạng HH:MM' })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'closeTime phải có định dạng HH:MM',
  })
  @IsAfterTime('openTime', { message: 'Giờ đóng cửa phải sau giờ mở cửa' })
  closeTime: string

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'is24Hours phải là boolean' })
  is24Hours: boolean

  @ApiProperty({ example: 2.5 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Chiều cao xe tối đa phải là số' },
  )
  @IsPositive({ message: 'Chiều cao xe tối đa phải là số dương' })
  maxVehicleHeight: number

  @ApiProperty({ example: 2.0 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Chiều rộng xe tối đa phải là số' },
  )
  @IsPositive({ message: 'Chiều rộng xe tối đa phải là số dương' })
  maxVehicleWidth: number

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber({}, { message: 'Sức chứa mỗi tầng phải là số' })
  @IsPositive({ message: 'Sức chứa mỗi tầng phải là số dương' })
  totalCapacityEachLevel: number

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng số tầng phải là số' })
  @IsPositive({ message: 'Tổng số tầng phải là số dương' })
  totalLevel: number

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber({}, { message: 'Phần trăm xe điện phải là số' })
  @IsPositive({ message: 'Phần trăm xe điện phải là số dương' })
  electricCarPercentage: number

  @ApiProperty({
    example: '2024-12-30', // << SỬA LẠI VÍ DỤ THEO ĐỊNH DẠNG CHUẨN
    description: 'Ngày có hiệu lực (bắt buộc theo định dạng YYYY-MM-DD)',
  })
  @Type(() => Date) // 1. Giữ lại để NestJS tự động chuyển chuỗi ISO thành đối tượng Date
  @IsDate({ message: 'Ngày có hiệu lực phải là một ngày hợp lệ' }) // 2. (THÊM) Kiểm tra xem có phải là đối tượng Date hợp lệ không
  @MinDate(new Date(), { message: 'Ngày có hiệu lực phải sau ngày hiện tại' }) // 3. (THAY THẾ) Kiểm tra phải là ngày trong tương lai
  @IsNotEmpty({ message: 'Ngày có hiệu lực không được để trống' })
  effectiveDate: Date // << SỬA LẠI KIỂU DỮ LIỆU TỪ string SANG Date
}

// =================================================================
// == DTOs for the ParkingLotRequest Lifecycle
// =================================================================

/**
 * (SỬA ĐỔI) DTO để tạo một YÊU CẦU CẬP NHẬT.
 * Kế thừa từ CreateParkingLotDto nhưng tất cả các trường đều là optional.
 */
export class CreateParkingLotUpdateRequestDto extends PartialType(
  CreateParkingLotDto,
) {
  @ApiProperty({
    example: '2024-12-30', // << SỬA LẠI VÍ DỤ THEO ĐỊNH DẠNG CHUẨN
    description: 'Ngày có hiệu lực (bắt buộc theo định dạng YYYY-MM-DD)',
  })
  @Type(() => Date) // 1. Giữ lại để NestJS tự động chuyển chuỗi ISO thành đối tượng Date
  @IsDate({ message: 'Ngày có hiệu lực phải là một ngày hợp lệ' }) // 2. (THÊM) Kiểm tra xem có phải là đối tượng Date hợp lệ không
  @MinDate(new Date(), { message: 'Ngày có hiệu lực phải sau ngày hiện tại' }) // 3. (THAY THẾ) Kiểm tra phải là ngày trong tương lai
  @IsNotEmpty({ message: 'Ngày có hiệu lực không được để trống' })
  effectiveDate: Date // << SỬA LẠI KIỂU DỮ LIỆU TỪ string SANG Date
}

/**
 * (MỚI) DTO để tạo một YÊU CẦU XÓA.
 */
export class CreateParkingLotDeleteRequestDto {
  @ApiProperty({
    example: '2025-11-01T17:00:00.000Z',
    description: 'Ngày xóa có hiệu lực (ISO 8601 format)',
  })
  @Type(() => Date)
  @IsNotEmpty({ message: 'Ngày có hiệu lực không được để trống' })
  effectiveDate: Date
}

/**
 * (MỚI) DTO cho Admin duyệt/từ chối một yêu cầu.
 */
export class ReviewRequestDto {
  @ApiProperty({
    description: 'Trạng thái mới của yêu cầu',
    enum: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  })
  @IsEnum([RequestStatus.APPROVED, RequestStatus.REJECTED], {
    message: 'Trạng thái không hợp lệ',
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status: 'APPROVED' | 'REJECTED'

  @ApiProperty({
    required: false,
    example: 'Thông tin không chính xác, vui lòng cung cấp lại.',
    description: 'Lý do từ chối (bắt buộc nếu status là REJECTED)',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string
}

// =================================================================
// == DTOs for Responses (trả về cho client)
// =================================================================

@Exclude()
export class ParkingLotResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Type(() => AddressDto)
  addressId: AddressDto

  @Expose()
  openTime: string

  @Expose()
  closeTime: string

  @Expose()
  is24Hours: boolean

  @Expose()
  maxVehicleHeight: number

  @Expose()
  maxVehicleWidth: number

  @Expose()
  totalCapacityEachLevel: number

  @Expose()
  totalLevel: number

  @Expose()
  availableSpots: number

  @Expose()
  @Transform(({ obj }) => obj.parkingLotOperatorId.toString())
  parkingLotOperatorId: string

  @Expose()
  parkingLotStatus: string

  @Expose()
  electricCarPercentage: number
}

/**
 * (MỚI) DTO trả về cho một ParkingLotRequest.
 */
@Exclude()
export class ParkingLotRequestResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  requestType: string

  @Expose()
  status: string

  @Expose()
  payload: Record<string, any>

  @Expose()
  effectiveDate: Date

  @Expose()
  approvalDate?: Date

  @Expose()
  rejectionReason?: string

  @Expose()
  createdAt: Date
}

/**
 * (TINH GỌN) DTO trả về cho một ParkingLotHistoryLog.
 */
@Exclude()
export class ParkingLotHistoryLogResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Transform(({ obj }) => obj.parkingLotId.toString())
  parkingLotId: string

  @Expose()
  @Transform(({ obj }) => obj.requestId.toString())
  requestId: string

  @Expose()
  eventType: string // CREATED, UPDATED, DELETED

  @Expose()
  openTime: string

  @Expose()
  closeTime: string

  @Expose()
  is24Hours: boolean

  @Expose()
  maxVehicleHeight: number

  @Expose()
  maxVehicleWidth: number

  @Expose()
  totalCapacityEachLevel: number

  @Expose()
  totalLevel: number

  @Expose()
  electricCarPercentage: number

  @Expose()
  effectiveDate: Date

  @Expose()
  createdAt: Date // Ngày mà thay đổi được áp dụng
}

@Exclude()
export class ParkingLotSpotsUpdateDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @IsNumber({}, { message: 'availableSpots phải là một số' })
  @IsNotEmpty({ message: 'availableSpots không được để trống' })
  availableSpots: number
}

export class RequestStatusDto {
  @ApiProperty({ example: 'PENDING' })
  status: string
}
