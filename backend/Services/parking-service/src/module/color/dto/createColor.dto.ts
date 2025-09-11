import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateColorDto {
  @ApiProperty({
    example: 'Red',
  })
  @IsNotEmpty({ message: 'colorName không được để trống' })
  @IsString()
  colorName: string
}
