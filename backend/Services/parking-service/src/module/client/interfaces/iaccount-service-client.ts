// src/module/client/interfaces/iaccount-service-client.ts

export interface IAccountServiceClient {
  /**
   * @description Gọi API của Core Service để lấy danh sách ID người dùng theo vai trò.
   * @param roleName Tên vai trò (ví dụ: 'driver', 'operator', 'admin').
   * @returns Mảng các chuỗi ID của người dùng.
   */
  getUserIdsByRole(roleName: string): Promise<string[]>

  /**
   * @description Gọi API của Core Service để lấy trạng thái thanh toán theo ID thanh toán.
   * @param paymentId ID thanh toán của giao dịch.
   * @param userId ID người dùng (để so sánh)
   * @param status Trạng thái mong đợi (ví dụ: 'PAID')
   * @returns true nếu TẤT CẢ thông tin đều khớp.
   * @throws Lỗi (400, 404, 409) nếu thông tin không khớp hoặc không tìm thấy
   * @returns Trạng thái thanh toán (ví dụ: 'pending', 'completed', 'failed').
   */
  getPaymentStatusByPaymentId(
    paymentId: string,
    userId?: string,
    status?: string,
  ): Promise<boolean>

  /**
   * @description Gọi API của Core Service để tải ảnh lên Image Service.
   * @param fileBuffer Buffer của file ảnh.
   * @param ownerType Loại chủ sở hữu ảnh (ví dụ: 'ParkingSession').
   * @param ownerId ID tham chiếu (ví dụ: ID của ParkingSession).
   * @param description Mô tả ảnh.
   * @returns Promise<void>
   */
  uploadImageToImageService(
    fileBuffer: Buffer,
    ownerType: string,
    ownerId: string,
    description: string,
  ): Promise<boolean>
}

export const IAccountServiceClient = Symbol('IAccountServiceClient')
