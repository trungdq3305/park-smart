import type { ClientSession } from 'mongoose'

import type { GuestCard } from '../schemas/guestCard.schema'

export interface IGuestCardRepository {
  /**
   * Tạo một thẻ khách (guest card) mới.
   * @param guestCard Dữ liệu của thẻ cần tạo.
   * @param session Phiên làm việc (MongoDB session) để hỗ trợ transaction.
   * @returns Thẻ vừa được tạo.
   */
  createGuestCard(
    guestCard: Partial<GuestCard>,
    session?: ClientSession,
  ): Promise<GuestCard>

  /**
   * Tạo nhiều thẻ khách cùng lúc (Dùng cho chức năng Bulk Import).
   * @param guestCards Danh sách dữ liệu thẻ cần tạo.
   * @param session Phiên làm việc (MongoDB session).
   * @returns Danh sách các thẻ vừa được tạo.
   */
  bulkInsertAllowingFailures(
    guestCards: Partial<GuestCard>[],
    session?: ClientSession,
  ): Promise<{ successes: GuestCard[]; errors: any[] }>

  /**
   * Tìm một thẻ bằng ID của nó.
   * @param id ID của thẻ.
   * @returns Thẻ nếu tìm thấy, ngược lại trả về null.
   */
  findGuestCardById(id: string): Promise<GuestCard | null>

  /**
   * Tìm thẻ dựa trên UID của chip NFC trong một bãi xe cụ thể.
   * (Quan trọng cho việc check-in/check-out).
   * @param nfcUid Mã UID của thẻ.
   * @param parkingLotId ID của bãi xe.
   * @returns Thẻ nếu tìm thấy, ngược lại trả về null.
   */
  findGuestCardByNfcUid(
    nfcUid: string,
    parkingLotId: string,
  ): Promise<GuestCard | null>

  /**
   * Tìm thẻ dựa trên mã định danh (code) trong một bãi xe cụ thể.
   * (Dùng để tìm kiếm thủ công hoặc nhập liệu).
   * @param code Mã định danh (ví dụ: CARD_001).
   * @param parkingLotId ID của bãi xe.
   * @returns Thẻ nếu tìm thấy, ngược lại trả về null.
   */
  findGuestCardByCode(
    code: string,
    parkingLotId: string,
  ): Promise<GuestCard | null>

  /**
   * Lấy danh sách tất cả thẻ thuộc về một bãi xe cụ thể (phân trang).
   * @param parkingLotId ID của bãi xe.
   * @param page Số trang hiện tại.
   * @param pageSize Số lượng mục trên mỗi trang.
   * @param status (Tùy chọn) Lọc theo trạng thái thẻ.
   * @returns Một đối tượng chứa danh sách thẻ (data) và tổng số lượng (total).
   */
  findAllGuestCardsByParkingLot(
    parkingLotId: string,
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<{ data: GuestCard[]; total: number }>

  /**
   * Cập nhật thông tin của một thẻ.
   * @param id ID của thẻ cần cập nhật.
   * @param updateData Dữ liệu cần cập nhật.
   * @param session Phiên làm việc (MongoDB session).
   * @returns Thẻ sau khi cập nhật, hoặc null nếu không tìm thấy.
   */
  updateGuestCard(
    id: string,
    updateData: Partial<GuestCard>,
    session?: ClientSession,
  ): Promise<GuestCard | null>

  /**
   * Xóa mềm một thẻ (đánh dấu là đã xóa hoặc chuyển trạng thái sang INACTIVE).
   * @param id ID của thẻ cần xóa.
   * @param userId ID của người dùng thực hiện xóa (để ghi log).
   * @param session Phiên làm việc.
   * @returns Trả về true nếu thành công, ngược lại false.
   */
  softDeleteGuestCard(
    id: string,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean>
  /**
   * Xóa vĩnh viễn một thẻ khỏi cơ sở dữ liệu.
   * (Cẩn trọng: Thường chỉ dùng khi nhập sai hoặc dọn dẹp dữ liệu rác).
   * @param id ID của thẻ cần xóa.
   * @param session Phiên làm việc.
   * @returns Trả về true nếu xóa thành công, ngược lại false.
   */
  deleteGuestCardPermanently(
    id: string,
    session?: ClientSession,
  ): Promise<boolean>

  /**
   * Cập nhật trạng thái của thẻ dựa trên ID.
   * @param id ID của thẻ.
   * @param status Trạng thái mới.
   * @param userId ID của người dùng thực hiện cập nhật (để ghi log).
   * @param session Phiên làm việc (MongoDB session).
   * @returns Thẻ sau khi cập nhật, hoặc null nếu không tìm thấy.
   */
  updateStatusById(
    id: string,
    status: string,
    userId: string,
    session?: ClientSession,
  ): Promise<GuestCard | null>
}

export const IGuestCardRepository = Symbol('IGuestCardRepository')
