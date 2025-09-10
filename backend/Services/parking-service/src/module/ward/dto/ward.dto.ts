import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class WardDto {
  @ApiProperty({
    example: 'Phường Vĩnh Hải',
    description: 'Tên đầy đủ của phường/xã',
  })
  @IsString()
  @IsNotEmpty()
  wardName: string

  constructor(partial: WardDto) {
    this.wardName = partial.wardName
  }
}
