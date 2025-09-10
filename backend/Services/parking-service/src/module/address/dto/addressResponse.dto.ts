/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import mongoose from 'mongoose'

class WardInAddressDto {
  @ApiProperty()
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  _id: mongoose.Schema.Types.ObjectId

  @ApiProperty()
  ward_name: string
}

export class AddressResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1z', type: String })
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  _id: mongoose.Schema.Types.ObjectId

  @ApiProperty({
    example: '29 Lê Duẩn',
    type: String,
  })
  fullAddress: string

  @ApiProperty({ type: () => WardInAddressDto }) // Chỉ định type là DTO lồng nhau
  @Type(() => WardInAddressDto) // Dùng @Type để class-transformer biết cách biến đổi
  wardId: WardInAddressDto

  @ApiProperty({ example: 16.0544, type: Number })
  latitude: number

  @ApiProperty({ example: 108.2461, type: Number })
  longitude: number

  @ApiProperty({ example: 'Thành phố Hồ Chí Minh', type: String })
  city_name: string

  constructor(address: any) {
    this._id = address._id
    this.wardId = address.wardId
    this.fullAddress = address.fullAddress
    this.latitude = address.latitude
    this.longitude = address.longitude
    this.city_name = 'Thành phố Hồ Chí Minh'
  }
}
