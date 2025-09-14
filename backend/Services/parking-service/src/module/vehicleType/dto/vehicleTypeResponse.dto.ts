/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform } from 'class-transformer'

@Exclude()
export class VehicleTypeResponseDto {
  @ApiProperty({ example: '605e3f5f4f3e8c1d4c9f1e1z', type: String })
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @ApiProperty({ example: 'hybrid', description: 'Loại xe' })
  @Expose()
  typeName: string
}
