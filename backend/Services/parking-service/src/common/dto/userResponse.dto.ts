/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform, Type } from 'class-transformer'

import { RoleEnum } from '../enum/role.enum'

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

export class UserResponseDto {
  // --- Các trường chung ---
  @Expose()
  @ApiProperty({ example: '60f8f1b9b3e3e4a3f4e8b3a1' })
  id: string

  @Expose()
  @ApiProperty({ example: 'user@example.com' })
  email: string

  @Expose()
  @ApiProperty({ example: [RoleEnum.DRIVER], enum: RoleEnum, isArray: true })
  role: RoleEnum[]

  @Expose()
  @ApiProperty({ example: 'Nguyễn Văn A' })
  fullName: string

  // --- Các trường dành cho DRIVER ---
  @Expose()
  @ApiProperty({ required: false, example: 'd_60f8f1b9b3e3e4a3f4e8b3a2' })
  driverId?: string

  @Expose()
  @ApiProperty({ required: false, example: true })
  gender?: boolean

  @Expose()
  @ApiProperty({ required: false, example: 'A1-12345' })
  licenseNumber?: string

  // --- Các trường dành cho OPERATOR ---
  @Expose()
  @ApiProperty({ required: false, example: 'o_60f8f1b9b3e3e4a3f4e8b3a3' })
  operatorId?: string

  @Expose()
  @ApiProperty({ required: false, example: '0123456789' })
  taxCode?: string

  @Expose()
  @ApiProperty({ required: false, example: 'Công ty Vận tải ABC' })
  companyName?: string

  @Expose()
  @ApiProperty({ required: false, example: 'contact@abc-transport.com' })
  contactEmail?: string

  // --- Các trường dành cho ADMIN ---
  @Expose()
  @ApiProperty({ required: false, example: 'a_60f8f1b9b3e3e4a3f4e8b3a4' })
  adminId?: string

  @Expose()
  @ApiProperty({ required: false, example: 'Phòng Kỹ thuật' })
  department?: string

  @Expose()
  @ApiProperty({ required: false, example: 'Quản trị viên hệ thống' })
  position?: string
}
