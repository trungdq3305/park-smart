import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class WardDto {
  @ApiProperty({
    example: 'Phường Vĩnh Hải',
    description: 'Tên đầy đủ của phường/xã',
  })
  @IsString()
  @IsNotEmpty()
  ward_name: string

  constructor(partial: WardDto) {
    this.ward_name = partial.ward_name
  }
}
