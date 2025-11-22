import type { ClientSession } from 'mongoose' // <-- Thêm session

import type { UpdateParkingLotPolicyLinkDto } from '../dto/parkingLotPolicyLink.dto'
import type { ParkingLotPolicyLink } from '../schemas/parkingLotPolicyLink.schema'

export interface IParkingLotPolicyLinkRepository {
  /**
   * Tạo một liên kết mới.
   */
  createLink(
    linkDto: Partial<ParkingLotPolicyLink>,
    userId: string,
    session?: ClientSession, // <-- Nên có session
  ): Promise<ParkingLotPolicyLink | null>

  /**
   * Tìm một liên kết bằng ID.
   */
  findLinkById(id: string): Promise<ParkingLotPolicyLink | null>

  /**
   * Tìm tất cả các liên kết (kể cả cũ) cho một bãi xe (cho Admin).
   */
  findAllLinksByParkingLot(
    parkingLotId: string,
    page: number,
    pageSize: number,
    isDeleted: boolean,
  ): Promise<{ data: ParkingLotPolicyLink[]; total: number }>

  /**
   * ⭐️ SỬA ĐỔI QUAN TRỌNG ⭐️
   * Tìm TẤT CẢ các liên kết chính sách đang CÓ HIỆU LỰC tại một thời điểm.
   * (Service sẽ dùng 'priority' để lọc từ mảng này).
   * @param parkingLotId ID của bãi xe.
   * @param date Thời điểm cần kiểm tra (thường là 'now').
   */
  findActivePolicyLinks( // <-- Sửa: Số nhiều (Links)
    parkingLotId: string,
    date: Date,
  ): Promise<ParkingLotPolicyLink[]> // <-- Sửa: Trả về mảng []

  /**
   * Cập nhật một liên kết.
   */
  updateLink(
    id: string,
    linkDto: UpdateParkingLotPolicyLinkDto,
    userId: string,
    session?: ClientSession, // <-- Nên có session
  ): Promise<boolean>

  /**
   * Xóa mềm một liên kết.
   */
  softDeleteLink(
    id: string,
    userId: string,
    session?: ClientSession, // <-- Nên có session
  ): Promise<boolean>

  /**   * Cập nhật chỉ ngày kết thúc của một liên kết.
   * (Dùng khi muốn gia hạn hoặc kết thúc sớm một liên kết).
   * @param linkId ID của liên kết cần cập nhật.
   * @param endDate Ngày kết thúc mới (null nếu muốn bỏ ngày kết thúc).
   * @param userId ID của người vận hành (để kiểm tra quyền).
   */
  updateEndDate(linkId: string, endDate: Date, userId: string): Promise<boolean>

  /**   * Tìm tất cả các liên kết đã hết hạn nhưng vẫn đang được đánh dấu là hoạt động.
   * (Dùng để tự động vô hiệu hóa các liên kết này).
   * @param currentTime Thời điểm hiện tại để so sánh với endDate.
   */
  findExpiredActiveLinks(currentTime: Date): Promise<ParkingLotPolicyLink[]>
}

export const IParkingLotPolicyLinkRepository = Symbol(
  'IParkingLotPolicyLinkRepository',
)
