/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'
import mongoose from 'mongoose'

export class VehicleTypeResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1z', type: String })
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  _id: mongoose.Schema.Types.ObjectId

  @ApiProperty({
    example: 'hybrid',
    description: 'Loại xe',
  })
  @IsString()
  @IsNotEmpty()
  typeName: string

  constructor(partial: any) {
    this._id = partial._id
    this.typeName = partial.typeName
  }
}
