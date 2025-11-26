import type { ClientSession } from 'mongoose'
import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto } from 'src/common/dto/params.dto'

import type {
  CreatePackageRateDto,
  PackageRateResponseDto,
  UpdatePackageRateDto,
} from '../dto/packageRate.dto'

export interface IPackageRateService {
  /**
   * Tạo một gói giá (package rate) mới.
   * @param createDto Dữ liệu để tạo gói giá.
   * @param operatorId ID của người dùng đang thực hiện.
   */
  createPackageRate(
    createDto: CreatePackageRateDto,
    userId: string,
    externalSession?: ClientSession,
  ): Promise<PackageRateResponseDto>

  /**
   * Cập nhật thông tin một gói giá.
   * (Lưu ý: Service sẽ kiểm tra quyền sở hữu và logic 'isUsed' ở đây).
   * @param id ID của gói giá cần cập nhật.
   * @param updateDto Dữ liệu cập nhật.
   * @param userId ID của người dùng đang thực hiện.
   */
  updatePackageRate(
    id: IdDto,
    updateDto: UpdatePackageRateDto,
    userId: string,
  ): Promise<PackageRateResponseDto>

  /**
   * Lấy thông tin chi tiết một gói giá bằng ID.
   * @param id ID của gói giá.
   */
  findPackageRateById(id: IdDto): Promise<PackageRateResponseDto>

  /**
   * Lấy danh sách tất cả các gói giá do một người dùng tạo ra (có phân trang).
   * @param userId ID của người dùng.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   */
  findAllPackageRatesByCreator(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PackageRateResponseDto[]; pagination: PaginationDto }>

  /**
   * Xóa mềm một gói giá.
   * (Service sẽ kiểm tra xem gói này có đang được sử dụng hay không trước khi xóa).
   * @param id ID của gói giá cần xóa.
   * @param userId ID của người dùng đang thực hiện.
   */
  softDeletePackageRate(id: IdDto, userId: string): Promise<boolean>

  /**
   * Lấy danh sách tất cả các gói giá.
   * @returns Danh sách các gói giá.
   */
  findAllPackageRates(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PackageRateResponseDto[]; pagination: PaginationDto }>

  /**
   * Lấy danh sách tất cả các gói giá dưới dạng enum (không phân trang).
   * @returns Danh sách các gói giá.
   */
  findAllEnumPackageRates(): Promise<any[]>

  softDelete(
    id: string,
    userId: string,
    session: ClientSession,
  ): Promise<boolean>
}

export const IPackageRateService = Symbol('IPackageRateService')
