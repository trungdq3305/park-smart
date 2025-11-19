import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto } from 'src/common/dto/params.dto'

// Import DTOs liên quan đến Link
import type {
  CreateParkingLotPolicyLinkDto,
  ParkingLotPolicyLinkResponseDto, // Giả định tên DTO response
  UpdateParkingLotPolicyLinkDto,
} from '../dto/parkingLotPolicyLink.dto' // <-- Giả định đường dẫn DTO

export interface IParkingLotPolicyLinkService {
  /**
   * Tạo một liên kết mới (gán 1 "sản phẩm" vào "menu" của bãi xe).
   * (Service sẽ kiểm tra quyền sở hữu bãi xe của 'userId').
   * @param createDto Dữ liệu để tạo liên kết.
   * @param userId ID của người vận hành (Admin/Operator) đang thực hiện.
   */
  createLink(
    createDto: CreateParkingLotPolicyLinkDto,
    userId: string,
  ): Promise<ParkingLotPolicyLinkResponseDto>

  /**
   * Cập nhật một liên kết (ví dụ: thay đổi 'priority' hoặc 'endDate').
   * @param id ID của liên kết.
   * @param updateDto Dữ liệu cập nhật.
   * @param userId ID của người vận hành (để kiểm tra quyền).
   */
  updateLink(
    id: IdDto,
    updateDto: UpdateParkingLotPolicyLinkDto,
    userId: string,
  ): Promise<boolean>

  /**
   * Lấy thông tin chi tiết một liên kết bằng ID.
   * @param id ID của liên kết.
   */
  findLinkById(id: IdDto): Promise<ParkingLotPolicyLinkResponseDto>

  /**
   * (Cho Admin) Lấy tất cả các liên kết (kể cả cũ/hết hạn) của 1 bãi xe.
   * @param parkingLotId ID của bãi xe.
   * @param paginationQuery Tùy chọn phân trang (page, pageSize).
   * @param isDeleted Có lấy các liên kết đã xóa mềm hay không.
   */
  findAllLinksByParkingLot(
    parkingLotId: string,
    paginationQuery: PaginationQueryDto,
    isDeleted: boolean,
  ): Promise<{
    data: ParkingLotPolicyLinkResponseDto[]
    pagination: PaginationDto
  }>

  /**
   * (Cho Khách hàng) Lấy TẤT CẢ các chính sách giá ĐANG HOẠT ĐỘNG
   * (đã populate đầy đủ) cho một bãi xe.
   * (Đây là hàm gọi API 'GET /parking-lots/:id/policies' của bạn).
   * @param parkingLotId ID của bãi xe.
   */
  getActivePoliciesForParkingLot(
    parkingLotId: string,
  ): Promise<ParkingLotPolicyLinkResponseDto[]> // Trả về mảng (Frontend tự lọc basis)

  /**
   * Xóa mềm một liên kết.
   * (Service sẽ kiểm tra xem chính sách này có đang được dùng không trước khi xóa).
   * @param id ID của liên kết.
   * @param userId ID của người vận hành (để kiểm tra quyền).
   */
  softDeleteLink(id: IdDto, userId: string): Promise<boolean>
}

export const IParkingLotPolicyLinkService = Symbol(
  'IParkingLotPolicyLinkService',
)
