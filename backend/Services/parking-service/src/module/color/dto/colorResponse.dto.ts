/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import mongoose from 'mongoose'

export class ColorResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1z', type: String })
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  _id: mongoose.Schema.Types.ObjectId

  @ApiProperty({
    example: 'Toyota',
    type: String,
  })
  colorName: string

  @ApiProperty({ example: null, type: String, nullable: true })
  deletedBy: string

  @ApiProperty({ example: null, type: Date, nullable: true })
  deletedAt: Date | null

  constructor(color: any) {
    this._id = color._id
    this.colorName = color.colorName
    this.deletedAt = color.deletedAt
    this.deletedBy = color.deletedBy
  }
}
