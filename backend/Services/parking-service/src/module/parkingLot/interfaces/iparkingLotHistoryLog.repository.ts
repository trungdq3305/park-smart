import { ParkingLotHistoryLog } from '../schemas/parkingLotHistoryLog.schema'
export interface IParkingLotHistoryLogRepository {
  createParkingLotHistoryLog(
    parkingLotHistoryLog: ParkingLotHistoryLog,
  ): Promise<ParkingLotHistoryLog>
  findByParkingLotId(
    parkingLotId: string,
  ): Promise<ParkingLotHistoryLog[] | null>
  updateParkingLotHistoryLogStatus(
    id: string,
    statusId: string,
  ): Promise<boolean>
}
