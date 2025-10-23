import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

/**
 * DTO cho truy vấn phân trang
 * Sử dụng để xác định thông tin phân trang trong các yêu cầu API
 * Bao gồm các trường:
 * @param page: Số trang hiện tại (mặc định là 1)
 * @param pageSize: Kích thước trang (số mục trên mỗi trang, mặc định là 10)
 */
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
