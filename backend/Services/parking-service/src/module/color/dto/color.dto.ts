/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform } from 'class-transformer'
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator'

// --- DTO for URL Parameters ---
export class ColorIdParamDto {
  @IsMongoId({ message: 'ID màu sắc không hợp lệ' })
  id: string
}

// --- DTO for Request Body ---
export class CreateColorDto {
  @ApiProperty({ example: 'Red' })
  @IsNotEmpty({ message: 'colorName không được để trống' })
  @IsString()
  colorName: string
}

// --- DTO for Response ---
@Exclude()
export class ColorResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1a', type: String })
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @ApiProperty({ example: 'Red', type: String })
  @Expose()
  colorName: string

  // Các trường này chỉ được expose nếu có giá trị
  @Expose()
  deletedBy: string

  @Expose()
  deletedAt: Date | null
}
