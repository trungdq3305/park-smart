import type { IdDto } from 'src/common/dto/params.dto'

import type { ParkingSpaceStatusResponseDto } from '../dto/parkingSpaceStatus.dto'

export interface IParkingSpaceStatusService {
  getParkingSpaceStatusById(id: IdDto): Promise<ParkingSpaceStatusResponseDto>
  getAllParkingSpaceStatuses(): Promise<ParkingSpaceStatusResponseDto[]>
}
export const IParkingSpaceStatusService = Symbol('IParkingSpaceStatusService')
