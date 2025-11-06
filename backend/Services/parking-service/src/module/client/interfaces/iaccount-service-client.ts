// src/module/client/interfaces/iaccount-service-client.ts

export interface IAccountServiceClient {
  /**
   * @description Gọi API của Core Service để lấy danh sách ID người dùng theo vai trò.
   * @param roleName Tên vai trò (ví dụ: 'driver', 'operator', 'admin').
   * @returns Mảng các chuỗi ID của người dùng.
   */
  getUserIdsByRole(roleName: string): Promise<string[]>

  /**
   * @description Gọi API của Core Service để lấy trạng thái thanh toán theo External ID.
   * @param ExternalId ID bên ngoài của giao dịch thanh toán.
   * @returns Trạng thái thanh toán (ví dụ: 'pending', 'completed', 'failed').
   */
  getPaymentStatusByExternalId(ExternalId: string): Promise<string>
}

export const IAccountServiceClient = Symbol('IAccountServiceClient')
