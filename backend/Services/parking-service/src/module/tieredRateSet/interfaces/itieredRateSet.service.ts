import type { ClientSession } from 'mongoose'
import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto } from 'src/common/dto/params.dto'

// Import các DTOs liên quan đến TieredRateSet
import type {
  CreateTieredRateSetDto,
  TieredRateSetResponseDto, // Giả định tên DTO response
  UpdateTieredRateSetDto,
} from '../dto/tieredRateSet.dto'

export interface ITieredRateSetService {
  /**
   * Tạo một bộ giá bậc thang mới.
   * (Service sẽ kiểm tra trùng lặp tên (findSetByName)
   * và gán userId cho bản ghi).
   * @param createDto Dữ liệu để tạo bộ giá.
   * @param userId ID của người vận hành đang thực hiện.
   */
  createSet(
    createDto: CreateTieredRateSetDto,
    userId: string,
    externalSession?: ClientSession,
  ): Promise<TieredRateSetResponseDto>

  /**
   * Cập nhật thông tin một bộ giá bậc thang.
   * (Service sẽ kiểm tra quyền sở hữu (findSetByIdAndCreator)
   * và logic nghiệp vụ, ví dụ: không cho cập nhật nếu đang được sử dụng).
   * @param id ID của bộ giá cần cập nhật.
   * @param updateDto Dữ liệu cập nhật.
   * @param userId ID của người dùng đang thực hiện.
   */
  updateSet(
    id: IdDto,
    updateDto: UpdateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSetResponseDto>

  /**
   * Lấy thông tin chi tiết một bộ giá bằng ID.
   * (Service sẽ gọi findSetById từ Repo).
   * @param id ID của bộ giá.
   */
  findSetById(id: IdDto): Promise<TieredRateSetResponseDto>

  /**
   * Lấy danh sách tất cả các bộ giá do một người dùng tạo ra (có phân trang).
   * @param userId ID của người dùng.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllSetsByCreator(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: TieredRateSetResponseDto[]; pagination: PaginationDto }>

  /**
   * Xóa mềm một bộ giá bậc thang.
   * (Service sẽ kiểm tra xem bộ giá này có đang được sử dụng hay không
   * (countPoliciesUsingSet) trước khi gọi softDeleteSet).
   * @param id ID của bộ giá cần xóa.
   * @param userId ID của người dùng đang thực hiện.
   */
  softDeleteSet(id: IdDto, userId: string): Promise<boolean>

  /**
   * Lấy danh sách tất cả các bộ giá (cho admin hoặc mục đích quản lý chung).
   * @param userId ID của người dùng.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllSetsForAdmin(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: TieredRateSetResponseDto[]; pagination: PaginationDto }>
}

export const ITieredRateSetService = Symbol('ITieredRateSetService')
