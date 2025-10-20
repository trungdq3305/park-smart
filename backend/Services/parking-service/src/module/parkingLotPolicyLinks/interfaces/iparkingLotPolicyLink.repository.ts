import type {
  CreateParkingLotPolicyLinkDto,
  UpdateParkingLotPolicyLinkDto,
} from '../dto/parkingLotPolicyLink.dto'
import type { ParkingLotPolicyLink } from '../schemas/parkingLotPolicyLink.schema'

export interface IParkingLotPolicyLinkRepository {
  /**
   * Tạo một liên kết mới giữa bãi xe và chính sách giá.
   * @param linkDto Dữ liệu để tạo liên kết.
   */
  createLink(
    linkDto: CreateParkingLotPolicyLinkDto,
  ): Promise<ParkingLotPolicyLink>

  /**
   * Tìm một liên kết bằng ID.
   * @param id ID của liên kết.
   */
  findLinkById(id: string): Promise<ParkingLotPolicyLink | null>

  /**
   * Tìm tất cả các liên kết (đã, đang và sẽ áp dụng) cho một bãi xe cụ thể.
   * @param parkingLotId ID của bãi xe.
   * @param page Số trang.
   * @param pageSize Kích thước trang.
   */
  findAllLinksByParkingLot(
    parkingLotId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLotPolicyLink[]; total: number }>

  /**
   * Tìm liên kết chính sách đang có hiệu lực cho một bãi xe tại một thời điểm.
   * Đây là hàm cốt lõi để xác định giá áp dụng khi xe vào bãi.
   * @param parkingLotId ID của bãi xe.
   * @param date Thời điểm cần kiểm tra (thường là thời gian xe vào).
   */
  findActivePolicyLink(
    parkingLotId: string,
    date: Date,
  ): Promise<ParkingLotPolicyLink | null>

  /**
   * Cập nhật một liên kết.
   * Dùng chủ yếu để cập nhật 'endDate' nhằm vô hiệu hóa một chính sách giá cũ.
   * @param id ID của liên kết cần cập nhật.
   * @param linkDto Dữ liệu cập nhật.
   */
  updateLink(
    id: string,
    linkDto: UpdateParkingLotPolicyLinkDto,
  ): Promise<boolean>

  /**
   * Xóa mềm một liên kết.
   * @param id ID của liên kết cần xóa.
   */
  softDeleteLink(id: string): Promise<boolean>
}

export const IParkingLotPolicyLinkRepository = Symbol(
  'IParkingLotPolicyLinkRepository',
)
