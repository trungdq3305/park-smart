import type { ClientSession } from 'mongoose' // <-- Thêm session

import type {
  CreateParkingLotPolicyLinkDto,
  UpdateParkingLotPolicyLinkDto,
} from '../dto/parkingLotPolicyLink.dto'
import type { ParkingLotPolicyLink } from '../schemas/parkingLotPolicyLink.schema'

export interface IParkingLotPolicyLinkRepository {
  /**
   * Tạo một liên kết mới.
   */
  createLink(
    linkDto: CreateParkingLotPolicyLinkDto,
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
}

export const IParkingLotPolicyLinkRepository = Symbol(
  'IParkingLotPolicyLinkRepository',
)
