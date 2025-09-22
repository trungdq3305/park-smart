import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number) // Chuyển đổi string từ query param sang number
  @IsInt()
  @Min(1)
  page: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Giới hạn kích thước trang tối đa để tránh quá tải
  pageSize: number
}
