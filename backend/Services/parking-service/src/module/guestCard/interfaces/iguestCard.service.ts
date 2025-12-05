import type { PaginatedResponseDto } from 'src/common/dto/paginatedResponse.dto'

import type {
  BulkCreateGuestCardsDto,
  BulkImportResultDto,
  CreateGuestCardDto,
  GuestCardResponseDto,
  UpdateGuestCardDto,
} from '../dto/guestCard.dto'

export interface IGuestCardService {
  /**
   * Tạo một thẻ khách mới (đơn lẻ).
   * Thường dùng khi thêm thủ công một thẻ bị sót hoặc cấp mới.
   * @param createGuestCardDto Dữ liệu tạo thẻ.
   * @param userId ID của người dùng (ParkingLotOperator) thực hiện thao tác.
   * @returns Thông tin thẻ vừa tạo.
   */
  createGuestCard(
    createGuestCardDto: CreateGuestCardDto,
    userId: string,
  ): Promise<GuestCardResponseDto>

  /**
   * Nhập kho thẻ hàng loạt (Bulk Import).
   * Xử lý logic kiểm tra trùng lặp và validate dữ liệu với cơ chế Partial Success.
   * @param bulkCreateDto Dữ liệu nhập kho (bao gồm parkingLotId và danh sách thẻ).
   * @param userId ID của người dùng (ParkingLotOperator) thực hiện thao tác.
   * @returns Báo cáo chi tiết số lượng thành công/thất bại và danh sách lỗi.
   */
  bulkCreateGuestCards(
    bulkCreateDto: BulkCreateGuestCardsDto,
    userId: string,
  ): Promise<BulkImportResultDto>

  /**
   * Lấy danh sách thẻ thuộc về một bãi xe cụ thể (có phân trang).
   * @param parkingLotId ID của bãi xe.
   * @param page Số trang hiện tại (mặc định 1).
   * @param pageSize Số lượng item trên mỗi trang (mặc định 10).
   * @param status (Tùy chọn) Lọc theo trạng thái thẻ.
   * @returns Đối tượng chứa danh sách thẻ (data) và tổng số lượng (total).
   */
  findAllGuestCards(
    parkingLotId: string,
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<PaginatedResponseDto<GuestCardResponseDto>>

  /**
   * Tìm chi tiết một thẻ bằng ID.
   * @param id ID của thẻ.
   * @returns Thông tin chi tiết thẻ.
   * @throws NotFoundException nếu không tìm thấy.
   */
  findGuestCardById(id: string): Promise<GuestCardResponseDto>

  /**
   * Tìm thẻ dựa trên mã NFC UID tại một bãi xe cụ thể.
   * Dùng cho luồng Check-in/Check-out để xác định thẻ.
   * @param nfcUid Mã UID của thẻ.
   * @param parkingLotId ID bãi xe hiện tại.
   * @returns Thông tin thẻ nếu tồn tại và hợp lệ, ngược lại trả về null.
   */
  findGuestCardByNfc(
    nfcUid: string,
    parkingLotId: string,
  ): Promise<GuestCardResponseDto | null>

  /**
   * Cập nhật thông tin thẻ (Ví dụ: Khóa thẻ, đổi trạng thái).
   * @param id ID của thẻ.
   * @param updateGuestCardDto Dữ liệu cần cập nhật.
   * @param userId ID người dùng thực hiện cập nhật (để lưu log updatedBy).
   * @returns Thông tin thẻ sau khi cập nhật.
   */
  updateGuestCard(
    id: string,
    updateGuestCardDto: UpdateGuestCardDto,
    userId: string, // 👈 Bổ sung userId để lưu vết
  ): Promise<GuestCardResponseDto>

  /**
   * Xóa mềm một thẻ (Soft Delete).
   * Thường sẽ chuyển trạng thái sang INACTIVE hoặc đánh dấu deletedAt.
   * @param id ID của thẻ.
   * @param userId ID người dùng thực hiện xóa (để lưu log deletedBy).
   * @returns True nếu xóa thành công.
   */
  softDeleteGuestCard(
    id: string,
    userId: string, // 👈 Bổ sung userId để lưu vết
  ): Promise<boolean>

  /**
   * Cập nhật trạng thái của thẻ (Ví dụ: ACTIVE, INACTIVE).
   * @param id ID của thẻ.
   * @param status Trạng thái mới cần cập nhật.
   * @param userId ID người dùng thực hiện cập nhật (để lưu log). xe).
   * @returns Thông tin thẻ sau khi cập nhật trạng thái.
   */
  updateGuestCardStatus(
    id: string,
    status: string,
    userId: string,
  ): Promise<GuestCardResponseDto>
}

// Symbol dùng cho Dependency Injection trong NestJS
export const IGuestCardService = Symbol('IGuestCardService')
