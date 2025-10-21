// Import DTOs và Schema liên quan đến TieredRateSet
import type {
  CreateTieredRateSetDto,
  UpdateTieredRateSetDto,
} from '../dto/tieredRateSet.dto'
import type { TieredRateSet } from '../schemas/tieredRateSet.schema'

export interface ITieredRateSetRepository {
  /**
   * Tạo một bộ giá bậc thang mới do một người vận hành cụ thể.
   * @param dto Dữ liệu để tạo bộ giá mới.
   * @param userId ID của người vận hành (ParkingLotOperator) tạo ra bộ giá này.
   */
  createSet(
    dto: CreateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSet | null>

  /**
   * Lấy danh sách tất cả bộ giá thuộc về một người vận hành (hỗ trợ phân trang).
   * @param userId ID của người vận hành.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findAllSetsByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: TieredRateSet[]; total: number }>

  /**
   * Tìm một bộ giá bằng ID.
   * @param id ID của bộ giá.
   */
  findSetById(id: string): Promise<TieredRateSet | null>

  /**
   * Tìm một bộ giá bằng ID và đảm bảo nó thuộc về đúng người tạo.
   * @param id ID của bộ giá.
   * @param userId ID của người vận hành.
   */
  findSetByIdAndCreator(
    id: string,
    userId: string,
  ): Promise<TieredRateSet | null>

  /**
   * Cập nhật một bộ giá bằng ID, chỉ chủ sở hữu mới được cập nhật.
   * @param id ID của bộ giá cần cập nhật.
   * @param dto Dữ liệu cập nhật.
   * @param userId ID của người vận hành.
   */
  updateSet(
    id: string,
    dto: UpdateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSet | null>

  /**
   * Xóa mềm một bộ giá.
   * (Lưu ý: Service sẽ kiểm tra xem bộ giá này có đang được sử dụng
   * bởi bất kỳ PricingPolicy nào không trước khi gọi hàm này).
   * @param id ID của bộ giá cần xóa.
   * @param userId ID của người vận hành (để xác thực quyền).
   */
  softDeleteSet(id: string, userId: string): Promise<boolean>

  /**
   * Tìm một bộ giá theo tên và người tạo (để kiểm tra trùng lặp).
   * Có thể được sử dụng trong một transaction (session).
   * @param name Tên của bộ giá.
   * @param userId ID của người vận hành.
   * @param session Tùy chọn, phiên làm việc của transaction.
   */
  findSetByName(name: string, userId: string): Promise<TieredRateSet | null>

  /**
   * Đánh dấu một bộ giá là đang được sử dụng hoặc không.
   * @param id ID của bộ giá.
   * @param isUsed Trạng thái sử dụng mới.
   */
  markSetAsUsed(id: string, isUsed: boolean): Promise<boolean>

  /**
   * Lấy danh sách tất cả bộ giá thuộc về một người vận hành (hỗ trợ phân trang).
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findAllSetsForAdmin(
    page: number,
    pageSize: number,
  ): Promise<{ data: TieredRateSet[]; total: number }>
}

// Export Symbol để DI (Dependency Injection)
export const ITieredRateSetRepository = Symbol('ITieredRateSetRepository')
