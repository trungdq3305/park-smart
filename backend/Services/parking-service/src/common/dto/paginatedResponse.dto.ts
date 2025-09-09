import { ApiProperty } from '@nestjs/swagger'

class PaginationDto {
  @ApiProperty({ example: 100 })
  totalItems: number

  @ApiProperty({ example: 10 })
  totalPages: number

  @ApiProperty({ example: 1 })
  currentPage: number

  @ApiProperty({ example: 10 })
  pageSize: number
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[]

  @ApiProperty({ type: () => PaginationDto })
  pagination: PaginationDto

  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ example: 'Successful' })
  message: string

  @ApiProperty({ example: 200 })
  statusCode: number

  constructor(
    partial: Partial<PaginatedResponseDto<T>>,
    success: boolean = true,
    message: string = 'Successful',
  ) {
    this.data = partial.data ?? []
    this.pagination = partial.pagination ?? {
      totalItems: 0,
      totalPages: 0,
      currentPage: -1,
      pageSize: -1,
    }
    this.success = success
    this.message = message
    this.statusCode = partial.statusCode ?? 200
  }
}
