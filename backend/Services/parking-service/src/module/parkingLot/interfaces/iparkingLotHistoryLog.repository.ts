import type { ClientSession } from 'mongoose'

import type { ParkingLotHistoryLog } from '../schemas/parkingLotHistoryLog.schema'

// GỌN GÀNG HƠN RẤT NHIỀU
export interface IParkingLotHistoryLogRepository {
  // Nhiệm vụ chính: Tạo một bản ghi log mới sau khi CRON job chạy thành công
  create(
    logData: Partial<ParkingLotHistoryLog>,
    session: ClientSession,
  ): Promise<ParkingLotHistoryLog>

  // Vẫn hữu ích để xem lại lịch sử của một bãi xe
  findByParkingLotId(parkingLotId: string): Promise<ParkingLotHistoryLog[]>

  // findAllForOperator có thể vẫn cần thiết tùy vào logic của bạn
  findAllForOperator(operatorId: string): Promise<ParkingLotHistoryLog[]>
}

export const IParkingLotHistoryLogRepository = Symbol(
  'IParkingLotHistoryLogRepository',
)
