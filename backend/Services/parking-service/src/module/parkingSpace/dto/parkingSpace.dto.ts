/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { IsMongoId, IsNotEmpty } from 'class-validator'

class ParkingSpaceStatusDto {
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString())
  _id: string

  @Expose()
  status: string
}

@Exclude()
export class ParkingSpaceResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Type(() => ParkingSpaceStatusDto)
  parkingSpaceStatusId: ParkingSpaceStatusDto

  @Expose()
  code: string

  @Expose()
  level: number

  @Expose()
  isElectricCar: boolean
}

export class UpdateParkingSpaceStatusDto {
  @ApiProperty({
    description: 'ID của trạng thái mới (ParkingSpaceStatus)',
    example: '68e51c5f4745c81c82b61833',
  })
  @IsNotEmpty({
    message: 'parkingSpaceStatusId không được để trống',
  })
  @IsMongoId({ message: 'parkingSpaceStatusId phải là một MongoID' })
  parkingSpaceStatusId: string
}

@Exclude()
export class ParkingSpaceUpdateRealTimeDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: string

  @Expose()
  @Type(() => ParkingSpaceStatusDto)
  parkingSpaceStatusId: ParkingSpaceStatusDto
}
