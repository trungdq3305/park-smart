import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString } from 'class-validator'

export class ChatHistoryItemDto {
  @ApiProperty({
    example: 'Tôi muốn đăng ký tài khoản.',
    description: 'Nội dung tin nhắn.',
  })
  @IsNotEmpty()
  @IsString()
  text: string

  @ApiProperty({ example: 'user', enum: ['user', 'model'] })
  @IsNotEmpty()
  @IsIn(['user', 'model'], { message: 'Sender phải là user hoặc model.' })
  sender: 'user' | 'model'
}
