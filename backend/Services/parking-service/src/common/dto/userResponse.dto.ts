/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Expose, Transform, Type } from 'class-transformer'

export class DriverDetailDto {
  @Expose()
  fullName: string
}

export class UserMinimalResponseDto {
  @Expose()
  @Transform(({ value }) => value.toString()) // Đảm bảo _id là string
  _id: string

  @Expose()
  roleName: string

  @Expose()
  email: string

  // Dùng @Type để báo cho class-transformer biết cách xử lý object lồng nhau
  @Expose()
  @Type(() => DriverDetailDto)
  driverDetail: DriverDetailDto
}
