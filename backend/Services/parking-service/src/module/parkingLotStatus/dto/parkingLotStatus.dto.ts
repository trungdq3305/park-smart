/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform } from 'class-transformer'

@Exclude()
export class ParkingLotStatusResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @ApiProperty({ example: 'Đang chờ duyệt' })
  @Expose()
  status: string

  @ApiProperty({ example: 1 })
  @Expose()
  order: number
}
