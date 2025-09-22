/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform } from 'class-transformer'
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator'

// --- DTO for URL Parameters ---
export class BrandIdParamDto {
  @IsMongoId({ message: 'ID hãng xe không hợp lệ' })
  id: string
}

// --- DTO for Request Body ---
export class CreateBrandDto {
  @ApiProperty({ example: 'Toyota' })
  @IsNotEmpty({ message: 'brandName không được để trống' })
  @IsString()
  brandName: string
}

// --- DTO for Response ---
@Exclude()
export class BrandResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1a', type: String })
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @ApiProperty({ example: 'Toyota', type: String })
  @Expose()
  brandName: string

  // Các trường này chỉ được expose khi service trả về
  @Expose()
  deletedBy: any // Kiểu `any` để chứa object user sau khi call API

  @Expose()
  deletedAt: Date | null
}
