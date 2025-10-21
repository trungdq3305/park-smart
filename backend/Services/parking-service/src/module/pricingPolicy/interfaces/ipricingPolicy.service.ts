import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto } from 'src/common/dto/params.dto'

// Import các DTOs liên quan đến PricingPolicy
import type {
  CreatePricingPolicyDto,
  PricingPolicyResponseDto, // Giả định tên DTO response
} from '../dto/pricingPolicy.dto'

export interface IPricingPolicyService {
  /**
   * Tạo một chính sách giá mới.
   * (Service sẽ kiểm tra tính hợp lệ của các ID (basisId, ...)
   * và đảm bảo chúng thuộc về người dùng này).
   * @param createDto Dữ liệu để tạo chính sách giá.
   * @param userId ID của người vận hành đang thực hiện.
   */
  createPolicy(
    createDto: CreatePricingPolicyDto,
    userId: string,
  ): Promise<PricingPolicyResponseDto>

  /**
   * Lấy thông tin chi tiết đầy đủ của một chính sách giá bằng ID.
   * (Service sẽ gọi getPolicyDetailsById từ Repo để populate tất cả dữ liệu).
   * @param id ID của chính sách giá.
   */
  getPolicyDetails(id: IdDto): Promise<PricingPolicyResponseDto>

  /**
   * Lấy danh sách tất cả các chính sách giá do một người dùng tạo ra (có phân trang).
   * @param userId ID của người dùng.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllPoliciesByCreator(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PricingPolicyResponseDto[]; pagination: PaginationDto }>

  /**
   * Xóa mềm một chính sách giá.
   * (Service sẽ kiểm tra xem chính sách này có đang được liên kết
   * với bãi đỗ xe nào không trước khi xóa).
   * @param id ID của chính sách giá cần xóa.
   * @param userId ID của người dùng đang thực hiện.
   */
  softDeletePolicy(id: IdDto, userId: string): Promise<boolean>

  /**
   * Lấy danh sách tất cả các chính sách giá (cho admin hoặc mục đích quản lý chung).
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllPolicies(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PricingPolicyResponseDto[]; pagination: PaginationDto }>

  /**
   * Lấy danh sách tất cả các chính sách giá của một người dùng
   * dưới dạng enum (không phân trang, dùng cho dropdown).
   * @param userId ID của người dùng.
   * @returns Danh sách các chính sách giá (ví dụ: { _id, name }).
   */
  findAllEnumPolicies(userId: string): Promise<any[]>
}

export const IPricingPolicyService = Symbol('IPricingPolicyService')
