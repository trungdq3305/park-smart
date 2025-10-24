import type { ClientSession } from 'mongoose'

import type { PackageRate } from '../schemas/packageRate.schema'

export interface IPackageRateRepository {
  /**
   * Tạo một gói giá (package rate) mới.
   * @param packageRate Dữ liệu của gói giá cần tạo.
   * @param userId ID của người dùng (ParkingLotOperator) tạo ra gói này.
   * @returns Gói giá vừa được tạo.
   */
  createPackageRate(
    packageRate: Partial<PackageRate>,
    userId: string,
    session: ClientSession,
  ): Promise<PackageRate | null>

  /**
   * Tìm một gói giá bằng ID của nó.
   * @param id ID của gói giá.
   * @returns Gói giá nếu tìm thấy, ngược lại trả về null.
   */
  findPackageRateById(id: string): Promise<PackageRate | null>

  /**
   * Lấy danh sách tất cả các gói giá được tạo bởi một người dùng cụ thể (phân trang).
   * @param userId ID của người dùng đã tạo ra các gói giá.
   * @param page Số trang hiện tại.
   * @param pageSize Số lượng mục trên mỗi trang.
   * @returns Một đối tượng chứa danh sách gói giá (data) và tổng số lượng (total).
   */
  findAllPackageRatesByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: PackageRate[]; total: number }>

  /**
   * Xóa mềm một gói giá (đánh dấu là đã xóa).
   * @param id ID của gói giá cần xóa mềm.
   * @returns Trả về true nếu xóa mềm thành công, ngược lại false.
   */
  softDeletePackageRate(id: string, userId: string): Promise<boolean>

  /**
   * Xóa vĩnh viễn một gói giá khỏi cơ sở dữ liệu.
   * (Cẩn trọng: Chỉ dùng khi gói giá này chưa từng được sử dụng).
   * @param id ID của gói giá cần xóa vĩnh viễn.
   * @returns Trả về true nếu xóa thành công, ngược lại false.
   */
  deletePackageRatePermanently(
    id: string,
    session: ClientSession,
  ): Promise<boolean>

  /**
   * Đánh dấu một gói giá là đang được sử dụng hoặc không.
   * (Hữu ích để ngăn chặn việc xóa/sửa một gói giá đang được gắn vào một chính sách).
   * @param id ID của gói giá.
   * @param isUsed Trạng thái sử dụng (true hoặc false).
   * @param session Phiên làm việc (MongoDB session).
   * @returns Gói giá đã được cập nhật.
   */
  setPackageRateInUsed(
    id: string,
    isUsed: boolean,
    session: ClientSession,
  ): Promise<boolean>

  /**
   * Đánh dấu một gói giá là đang được sử dụng hoặc không.
   * (Hữu ích để ngăn chặn việc xóa/sửa một gói giá đang được gắn vào một chính sách).
   * @param id ID của gói giá.
   * @param updateData Dữ liệu cập nhật cho gói giá.
   * @param userId id của người dùng.
   * @returns Gói giá đã được cập nhật.
   */
  updatePackageRate(
    id: string,
    updateData: Partial<PackageRate>,
    userId: string,
  ): Promise<PackageRate | null>

  /**
   * Đánh dấu một gói giá là đang được sử dụng hoặc không.
   * (Hữu ích để ngăn chặn việc xóa/sửa một gói giá đang được gắn vào một chính sách).
   * @param id ID của gói giá.
   * @param userId id của người dùng.
   * @returns Gói giá đã được cập nhật.
   */
  findPackageRateByIdAndCreator(
    id: string,
    userId: string,
  ): Promise<PackageRate | null>

  /**
   * Lấy danh sách tất cả các gói giá.
   * @returns Danh sách các gói giá.
   */
  findAllPackageRates(
    page: number,
    pageSize: number,
  ): Promise<{ data: PackageRate[]; total: number }>

  /**
   * Lấy danh sách tất cả các gói giá dưới dạng enum (không phân trang).
   * @returns Danh sách các gói giá.
   */
  findPackageRateByNameAndCreator(
    name: string,
    userId: string,
  ): Promise<boolean>
}

export const IPackageRateRepository = Symbol('IPackageRateRepository')
