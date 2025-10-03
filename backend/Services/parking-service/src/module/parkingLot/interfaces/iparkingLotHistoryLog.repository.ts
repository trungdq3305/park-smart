import type { ParkingLotHistoryLog } from '../schemas/parkingLotHistoryLog.schema'
export interface IParkingLotHistoryLogRepository {
  updateParkingLot(
    parkingLotHistory: Partial<ParkingLotHistoryLog>,
  ): Promise<ParkingLotHistoryLog>

  findByParkingLotId(
    parkingLotId: string,
  ): Promise<ParkingLotHistoryLog[] | null>

  updateParkingLotHistoryLogStatus(
    id: string,
    userId: string,
    statusId: string,
  ): Promise<boolean>

  deleteParkingLot(
    id: string,
    userId: string,
    statusId: string,
  ): Promise<boolean>

  findAllForOperator(operatorId: string): Promise<ParkingLotHistoryLog[]>
}

export const IParkingLotHistoryLogRepository = Symbol(
  'IParkingLotHistoryLogRepository',
)
