/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator'
import { IsAfterTime } from 'src/common/decorators/validTime.decorator'
import { UserMinimalResponseDto } from 'src/common/dto/userResponse.dto'

export class CreateParkingLotDto {
  @ApiProperty({ example: '650f1f4e8c3a3c1a1c8b4567' })
  @IsMongoId({ message: 'Mã địa chỉ không hợp lệ' })
  @IsNotEmpty({ message: 'Mã địa chỉ không được để trống' })
  addressId: string

  @ApiProperty({ example: '08:00' }) // Thêm required: false cho Swagger
  @IsString({
    message: 'openTime phải có định dạng HH:MM (ví dụ: 08:30)',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'openTime phải có định dạng HH:MM (ví dụ: 08:30)',
  })
  openTime: string

  @ApiProperty({ example: '17:00' })
  @IsString({
    message: 'closeTime phải có định dạng HH:MM (ví dụ: 17:00)',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'closeTime phải có định dạng HH:MM (ví dụ: 17:00)',
  })
  @IsAfterTime('openTime', {
    message: 'Giờ đóng cửa (closeTime) phải sau giờ mở cửa (openTime)',
  })
  closeTime: string

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'is24Hours phải là một boolean' })
  is24Hours: boolean

  @ApiProperty({
    example: 2.5,
    description: 'Chiều cao tối đa của xe (đơn vị: mét)',
  })
  @Type(() => Number) // 1. Chuyển đổi dữ liệu đầu vào thành kiểu Number
  @IsNumber(
    { maxDecimalPlaces: 2 }, // 2. Tùy chọn: Giới hạn số chữ số thập phân
    { message: 'Chiều cao xe tối đa phải là một số' },
  )
  @IsPositive({ message: 'Chiều cao xe tối đa phải là số dương' }) // 3. Thêm: Đảm bảo số > 0
  maxVehicleHeight: number

  @ApiProperty({
    example: 2.0,
    description: 'Chiều rộng tối đa của xe (đơn vị: mét)',
  })
  @Type(() => Number) // 1. Chuyển đổi dữ liệu đầu vào thành kiểu Number
  @IsNumber(
    { maxDecimalPlaces: 2 }, // 2. Tùy chọn: Giới hạn số chữ số thập phân
    { message: 'Chiều rộng xe tối đa phải là một số' },
  )
  @IsPositive({ message: 'Chiều rộng xe tối đa phải là số dương' }) // 3. Thêm: Đảm bảo số > 0
  maxVehicleWidth: number

  @ApiProperty({ example: 50, description: 'Tổng sức chứa mỗi tầng' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng sức chứa mỗi tầng phải là một số' })
  @IsPositive({ message: 'Tổng sức chứa mỗi tầng phải là số dương' })
  totalCapacityEachLevel: number

  @ApiProperty({ example: 5, description: 'Tổng số tầng của bãi đỗ xe' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng số tầng phải là một số' })
  @IsPositive({ message: 'Tổng số tầng phải là số dương' })
  totalLevel: number
}

export class UpdateParkingLotHistoryLogDto {
  @ApiProperty({ example: '650f1f4e8c3a3c1a1c8b4567' })
  @IsMongoId({ message: 'Mã bãi đỗ xe không hợp lệ' })
  @IsNotEmpty({ message: 'Mã bãi đỗ xe không được để trống' })
  parkingLotId: string

  @ApiProperty({ example: '08:00' }) // Thêm required: false cho Swagger
  @IsString({
    message: 'openTime phải có định dạng HH:MM (ví dụ: 08:30)',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'openTime phải có định dạng HH:MM (ví dụ: 08:30)',
  })
  openTime: string

  @ApiProperty({ example: '17:00' })
  @IsString({
    message: 'closeTime phải có định dạng HH:MM (ví dụ: 17:00)',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'closeTime phải có định dạng HH:MM (ví dụ: 17:00)',
  })
  @IsAfterTime('openTime', {
    message: 'Giờ đóng cửa (closeTime) phải sau giờ mở cửa (openTime)',
  })
  closeTime: string

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'is24Hours phải là một boolean' })
  is24Hours: boolean

  @ApiProperty({
    example: 2.5,
    description: 'Chiều cao tối đa của xe (đơn vị: mét)',
  })
  @Type(() => Number) // 1. Chuyển đổi dữ liệu đầu vào thành kiểu Number
  @IsNumber(
    { maxDecimalPlaces: 2 }, // 2. Tùy chọn: Giới hạn số chữ số thập phân
    { message: 'Chiều cao xe tối đa phải là một số' },
  )
  @IsPositive({ message: 'Chiều cao xe tối đa phải là số dương' }) // 3. Thêm: Đảm bảo số > 0
  maxVehicleHeight: number

  @ApiProperty({
    example: 2.0,
    description: 'Chiều rộng tối đa của xe (đơn vị: mét)',
  })
  @Type(() => Number) // 1. Chuyển đổi dữ liệu đầu vào thành kiểu Number
  @IsNumber(
    { maxDecimalPlaces: 2 }, // 2. Tùy chọn: Giới hạn số chữ số thập phân
    { message: 'Chiều rộng xe tối đa phải là một số' },
  )
  @IsPositive({ message: 'Chiều rộng xe tối đa phải là số dương' }) // 3. Thêm: Đảm bảo số > 0
  maxVehicleWidth: number

  @ApiProperty({ example: 50, description: 'Tổng sức chứa mỗi tầng' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng sức chứa mỗi tầng phải là một số' })
  @IsPositive({ message: 'Tổng sức chứa mỗi tầng phải là số dương' })
  totalCapacityEachLevel: number

  @ApiProperty({ example: 5, description: 'Tổng số tầng của bãi đỗ xe' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng số tầng phải là một số' })
  @IsPositive({ message: 'Tổng số tầng phải là số dương' })
  totalLevel: number
}

export class CoordinatesDto {
  @ApiProperty({ example: 10.762622 })
  @IsNotEmpty({ message: 'Latitude không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude phải là một số' })
  latitude: number

  @ApiProperty({ example: 106.660172 })
  @IsNotEmpty({ message: 'Longitude không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude phải là một số' })
  longitude: number
}

@Exclude()
export class AddressDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Transform(({ obj }) => obj.latitude)
  latitude: number

  @Expose()
  @Transform(({ obj }) => obj.longitude)
  longitude: number
}

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
  isApproved: boolean

  @Expose()
  availableSpots: number
}

@Exclude()
export class ParkingLotHistoryLogResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Transform(({ obj }) => obj.parkingLotId.toString())
  parkingLotId: string

  // Giữ lại các trường dữ liệu đã thay đổi
  @Expose()
  openTime?: string // Dùng optional (?) vì không phải lúc nào cũng thay đổi

  @Expose()
  closeTime?: string

  @Expose()
  is24Hours?: boolean

  @Expose()
  maxVehicleHeight?: number

  // ... các trường dữ liệu khác có thể thay đổi

  /**
   * MỚI: Thêm các trường ngày tháng quan trọng
   */
  @Expose()
  effectiveDate: Date // Ngày thay đổi sẽ có hiệu lực

  @Expose()
  approvalDeadline: Date // Hạn chót để duyệt

  /**
   * MỚI: Thêm các trường kế thừa từ BaseEntity để biết ai tạo, khi nào
   */
  @Expose()
  createdAt: Date

  @Expose()
  @Type(() => UserMinimalResponseDto) // Populate thông tin người tạo
  createdBy: UserMinimalResponseDto

  /**
   * MỚI: Thay thế parkingLotStatusId bằng status string
   * Dễ dàng hơn cho frontend
   */
  @Expose()
  @Transform(({ obj }) => obj.parkingLotStatusId?.status ?? obj.status) // Lấy tên status
  status: string // Trạng thái hiện tại (PENDING, APPROVED,...)
}

@Exclude()
export class ParkingLotMinimalResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Type(() => AddressDto)
  addressId: AddressDto

  @Expose()
  parkingLotOperator: string

  @Expose()
  availableSpots: number

  @Expose()
  openTime: string

  @Expose()
  closeTime: string

  @Expose()
  is24Hours: boolean
}

@Exclude()
export class ParkingLotSpotsUpdateDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  availableSpots: number
}

export class BoundingBoxDto {
  @IsLongitude()
  @Type(() => Number)
  bottomLeftLng: number // Kinh độ góc dưới-trái

  @IsLatitude()
  @Type(() => Number)
  bottomLeftLat: number // Vĩ độ góc dưới-trái

  @IsLongitude()
  @Type(() => Number)
  topRightLng: number // Kinh độ góc trên-phải

  @IsLatitude()
  @Type(() => Number)
  topRightLat: number // Vĩ độ góc trên-phải
}
