/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import { GuestCardStatus } from '../enums/guestCard.enum'

// --- DTO 1: Tạo mới 1 thẻ (Dùng cho API tạo lẻ) ---
export class CreateGuestCardDto {
  @ApiProperty({
    example: 'A4F2C91B',
    description: 'UID của thẻ NFC (Unique ID từ chip)',
  })
  @IsNotEmpty()
  @IsString()
  nfcUid: string

  @ApiProperty({
    example: 'GUEST_001',
    description: 'Mã định danh do hệ thống tự sinh hoặc người dùng nhập',
  })
  @IsNotEmpty()
  @IsString()
  code: string

  @ApiProperty({
    example: '605e3f5f4f3e8c1d4c9f1e1a',
    description: 'ID của bãi xe sở hữu thẻ này',
  })
  @IsNotEmpty()
  @IsMongoId()
  parkingLotId: string
}

// --- DTO 2: Item con trong mảng Bulk (Không cần parkingLotId vì dùng chung) ---
class GuestCardBulkItemDto {
  @ApiProperty({ example: 'A4F2C91B' })
  @IsNotEmpty()
  @IsString()
  nfcUid: string

  @ApiProperty({ example: 'GUEST_001' })
  @IsNotEmpty()
  @IsString()
  code: string
}

// --- DTO 3: Tạo hàng loạt (Dùng cho API Bulk Import) ---
export class BulkCreateGuestCardsDto {
  @ApiProperty({
    description: 'ID bãi xe áp dụng cho toàn bộ lô thẻ này',
    example: '605e3f5f4f3e8c1d4c9f1e1a',
  })
  @IsNotEmpty()
  @IsMongoId()
  parkingLotId: string

  @ApiProperty({
    description: 'Danh sách các thẻ cần nhập',
    type: [GuestCardBulkItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCardBulkItemDto)
  cards: GuestCardBulkItemDto[]
}

// --- DTO for Request Bodies (Cập nhật) ---
export class UpdateGuestCardDto {
  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsOptional()
  @IsString()
  status?: GuestCardStatus

  @ApiProperty({ example: 'A4F2C91B', required: false })
  @IsOptional()
  @IsString()
  nfcUid?: string

  @ApiProperty({ example: 'GUEST_001', required: false })
  @IsOptional()
  @IsString()
  code?: string
}

// --- DTO for Responses (Phản hồi) ---
@Exclude()
export class GuestCardResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  nfcUid: string

  @Expose()
  code: string

  @Expose()
  @Transform(({ obj }) => {
    // Xử lý trường hợp parkingLotId có thể là object (nếu populated) hoặc string
    return obj.parkingLotId?.toString()
  })
  parkingLotId: string

  @Expose()
  status: string

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date
}

@Exclude()
export class BulkImportResultDto {
  @Expose()
  totalRequest: number // Tổng số thẻ gửi lên

  @Expose()
  successCount: number // Số thẻ tạo thành công

  @Expose()
  failureCount: number // Số thẻ thất bại

  @Expose()
  successItems: GuestCardResponseDto[] // Danh sách thẻ thành công

  @Expose()
  @Type(() => GuestCardImportFailureDto)
  failures: GuestCardImportFailureDto[] // Danh sách lỗi chi tiết
}

@Exclude()
class GuestCardImportFailureDto {
  @Expose()
  nfcUid: string

  @Expose()
  code: string

  @Expose()
  reason: string // Lý do lỗi (VD: "Trùng NFC UID", "Trùng Mã")
}
