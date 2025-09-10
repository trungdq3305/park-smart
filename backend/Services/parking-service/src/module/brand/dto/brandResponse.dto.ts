/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import mongoose from 'mongoose'

export class BrandResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1z', type: String })
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  _id: mongoose.Schema.Types.ObjectId

  @ApiProperty({
    example: 'Toyota',
    type: String,
  })
  brandName: string

  @ApiProperty({ example: null, type: String, nullable: true })
  deletedBy: string

  @ApiProperty({ example: null, type: Date, nullable: true })
  deletedAt: Date | null

  constructor(brand: any) {
    this._id = brand._id
    this.brandName = brand.brandName
    this.deletedAt = brand.deletedAt
    this.deletedBy = brand.deletedBy
  }
}
