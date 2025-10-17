import type { CreatePricingPolicyDto } from '../dto/pricingPolicy.dto'
import type { PricingPolicy } from '../schemas/pricingPolicy.schema'

export interface IPricingPolicyRepository {
  /**
   * Tạo một chính sách giá mới do một người vận hành cụ thể.
   * @param policy Dữ liệu để tạo chính sách giá mới.
   * @param userId ID của người vận hành (ParkingLotOperator) tạo ra chính sách này.
   */
  createPolicy(
    policy: CreatePricingPolicyDto,
    userId: string,
  ): Promise<PricingPolicy | null>

  /**
   * Lấy danh sách tất cả chính sách giá thuộc về một người vận hành.
   * @param userId ID của người vận hành.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findAllPoliciesByPoliciesByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: PricingPolicy[]; total: number }>

  /**
   * Tìm một chính sách giá bằng ID.
   * @param id ID của chính sách giá.
   */
  findPolicyById(id: string): Promise<PricingPolicy | null>

  /**
   * Lấy toàn bộ thông tin chi tiết của một chính sách giá bằng Aggregation.
   * Bao gồm thông tin từ Basis, TieredRateSet, TieredRate, và PackageRate.
   * @param policyId ID của chính sách giá.
   */
  getPolicyDetailsById(policyId: string): Promise<PricingPolicy | null>

  /**
   * Xóa mềm một chính sách giá.
   * (Lưu ý: Service sẽ quyết định logic xóa, thường là vô hiệu hóa link thay vì xóa policy).
   * @param id ID của chính sách giá cần xóa.
   */
  softDeletePolicy(id: string, userId: string): Promise<boolean>
}

export const IPricingPolicyRepository = Symbol('IPricingPolicyRepository')
