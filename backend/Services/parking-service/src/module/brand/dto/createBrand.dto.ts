import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateBrandDto {
  @ApiProperty({
    example: 'Toyota',
  })
  @IsNotEmpty({ message: 'brandName không được để trống' })
  @IsString()
  brandName: string
}
