/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import mongoose from 'mongoose'

export class AddressResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1z', type: String })
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  _id: mongoose.Schema.Types.ObjectId

  @ApiProperty({
    example: '29 Lê Duẩn',
    type: String,
  })
  fullAddress: string

  @ApiProperty({
    example: '682dbf1e3ecf256c0683b4d8',
    type: String,
  })
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  wardId: mongoose.Schema.Types.ObjectId

  @ApiProperty({ example: 16.0544, type: Number })
  latitude: number

  @ApiProperty({ example: 108.2461, type: Number })
  longitude: number

  constructor(address: AddressResponseDto) {
    this._id = address._id
    this.wardId = address.wardId
    this.fullAddress = address.fullAddress
    this.latitude = address.latitude
    this.longitude = address.longitude
  }
}
