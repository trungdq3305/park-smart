import { ApiProperty } from '@nestjs/swagger'

export class ApiResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[]

  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ example: 'Successful' })
  message: string

  @ApiProperty({ example: 200 })
  statusCode: number

  constructor(partial: Partial<ApiResponseDto<T>>) {
    this.data = partial.data ?? []
    this.success = partial.success ?? true
    this.message = partial.message ?? 'Successful'
    this.statusCode = partial.statusCode ?? 200
  }
}
