import type { ClientSession } from 'mongoose'

import type { ParkingLotRequest } from '../schemas/parkingLotRequest.schema'

export interface IParkingLotRequestRepository {
  // Tạo một yêu cầu mới (do chủ bãi xe gửi)
  createNewRequest(
    requestData: Partial<ParkingLotRequest>,
    session: ClientSession,
  ): Promise<ParkingLotRequest>

  // Tìm một yêu cầu bằng ID
  findById(id: string): Promise<ParkingLotRequest | null>

  // Admin dùng để cập nhật trạng thái (duyệt/từ chối)
  updateStatus(
    id: string,
    status: string,
    userId?: string,
    rejectionReason?: string,
    session?: ClientSession,
  ): Promise<ParkingLotRequest | null>

  // Lấy các yêu cầu cho admin duyệt (VD: trạng thái PENDING)
  findPendingRequests(
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLotRequest[]; total: number }>

  // CRON job dùng để tìm các yêu cầu đã được duyệt và đến hạn
  findApprovedAndDueRequests(): Promise<ParkingLotRequest[]>

  findByParkingLotId(parkingLotId: string): Promise<ParkingLotRequest[]>

  findAllRequests(status: string, type: string): Promise<ParkingLotRequest[]>

  hardDeleteById(id: string, session?: ClientSession): Promise<boolean>
}

export const IParkingLotRequestRepository = Symbol(
  'IParkingLotRequestRepository',
)
