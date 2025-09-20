import { ParkingLotHistoryLog } from '../schemas/parkingLotHistoryLog.schema'
import { UpdateParkingLotHistoryLogDto } from '../dto/parkingLot.dto'
export interface IParkingLotHistoryLogRepository {
  updateParkingLot(
    parkingLotHistory: UpdateParkingLotHistoryLogDto,
  ): Promise<ParkingLotHistoryLog>

  findByParkingLotId(
    parkingLotId: string,
  ): Promise<ParkingLotHistoryLog[] | null>

  updateParkingLotHistoryLogStatus(
    id: string,
    statusId: string,
  ): Promise<boolean>
}
