import type { IdDto } from 'src/common/dto/params.dto'

import type { ParkingLotStatusResponseDto } from '../dto/parkingLotStatus.dto'

export interface IParkingLotStatusService {
  getParkingLotStatusById(id: IdDto): Promise<ParkingLotStatusResponseDto>
  getAllParkingLotStatuses(): Promise<ParkingLotStatusResponseDto[]>
}
export const IParkingLotStatusService = Symbol('IParkingLotStatusService')
