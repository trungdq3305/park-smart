import { IsOptional, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number) // Chuyển đổi string từ query param sang number
  @IsInt()
  @Min(1)
  pageNumber?: number = 1 // Giá trị mặc định là trang 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Giới hạn kích thước trang tối đa để tránh quá tải
  pageSize?: number = 100 // Giá trị mặc định là 10 item/trang
}
