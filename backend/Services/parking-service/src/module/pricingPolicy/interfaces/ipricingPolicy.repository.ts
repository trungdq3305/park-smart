import type { ClientSession } from 'mongoose'

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
    session: ClientSession,
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
  softDeletePolicy(
    id: string,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean>
  /**
   * Đếm số lượng chính sách giá (policies) KHÁC đang sử dụng một gói giá (package rate) cụ thể.
   *
   * Mục đích: Dùng để kiểm tra trước khi xóa/cập nhật một PackageRate,
   * hoặc khi cập nhật một PricingPolicy (thay đổi/xóa packageRateId).
   *
   * @param packageRateId ID của gói giá (PackageRate) cần kiểm tra.
   * @param policyIdToExclude ID của chính sách giá (PricingPolicy) hiện tại cần *loại trừ* khỏi việc đếm.
   * @param session (Tùy chọn) Phiên làm việc (session) của transaction.
   * @returns Promise<number> - Tổng số lượng chính sách *khác* đang sử dụng gói giá này.
   */
  countOtherPoliciesUsingPackageRate(
    packageRateId: string,
    policyIdToExclude: string,
    session?: ClientSession,
  ): Promise<number>

  /**
   * Đếm số lượng chính sách giá (policies) KHÁC đang sử dụng một bộ giá bậc thang (tiered rate set) cụ thể.
   *
   * Mục đích: Dùng để kiểm tra trước khi xóa/cập nhật một TieredRateSet,
   * hoặc khi cập nhật một PricingPolicy (thay đổi/xóa tieredRateSetId).
   *
   * @param tieredRateId ID của bộ giá bậc thang (TieredRateSet) cần kiểm tra.
   * @param policyIdToExclude ID của chính sách giá (PricingPolicy) hiện tại cần *loại trừ* khỏi việc đếm.
   * @param session (Tùy chọn) Phiên làm việc (session) của transaction.
   * @returns Promise<number> - Tổng số lượng chính sách *khác* đang sử dụng bộ giá này.
   */
  countOtherPoliciesUsingTieredRate(
    tieredRateId: string,
    policyIdToExclude: string,
    session?: ClientSession,
  ): Promise<number>

  /**
   * Lấy tất cả các chính sách giá trong hệ thống (dành cho vai trò Admin).
   *
   * Hàm này không lọc theo người tạo (userId) mà trả về toàn bộ dữ liệu (có phân trang).
   *
   * @param page Số trang hiện tại (dùng cho phân trang).
   * @param pageSize Số lượng mục trên mỗi trang.
   * @returns Promise<{ data: PricingPolicy[]; total: number }> - Danh sách các chính sách giá và tổng số lượng.
   */
  findAllPoliciesForAdmin(
    page: number,
    pageSize: number,
  ): Promise<{ data: PricingPolicy[]; total: number }>

  /**
   * Tìm một chính sách giá theo tên và người tạo.
   * @param name Tên của chính sách giá.
   * @param userId ID của người vận hành (ParkingLotOperator) đã tạo chính sách này.
   */
  findByNameAndCreator(
    name: string,
    userId: string,
  ): Promise<PricingPolicy | null>

  /**
   * Lấy giá của gói (package rate) từ một chính sách giá cụ thể.
   * @param policyId ID của chính sách giá.
   * @returns Giá của gói (package rate) hoặc null nếu không tìm thấy.
   */
  getUnitPackageRateByPolicyId(policyId: string): Promise<{
    unit: string
    durationAmount: number
  } | null>

  /**
   * Tìm một chính sách giá theo ID, dùng để kiểm tra gia hạn thuê bao.
   * @param policyId ID của chính sách giá.
   */
  findPolicyByIdForCheckRenew(policyId: string): Promise<PricingPolicy | null>
}

export const IPricingPolicyRepository = Symbol('IPricingPolicyRepository')
