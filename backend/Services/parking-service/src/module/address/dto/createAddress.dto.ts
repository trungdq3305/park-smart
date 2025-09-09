import { ApiProperty } from '@nestjs/swagger'
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator'

export class CreateAddressDto {
  @ApiProperty({
    example: '682dbf1e3ecf256c0683b4d8',
  })
  @IsMongoId()
  wardId: string

  @ApiProperty({
    example: '29 Lê Duẩn',
  })
  @IsNotEmpty()
  @IsString()
  fullAddress: string
}
