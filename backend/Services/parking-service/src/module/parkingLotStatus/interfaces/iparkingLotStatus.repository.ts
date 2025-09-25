import type { ParkingLotStatus } from '../schemas/parkingLotStatus.schema'

export interface IParkingLotStatusRepository {
  findParkingLotStatusById(id: string): Promise<ParkingLotStatus | null>
  findAllParkingLotStatuses(): Promise<ParkingLotStatus[]>
  findParkingLotStatusByStatus(status: string): Promise<string | null>
}

export const IParkingLotStatusRepository = Symbol('IParkingLotStatusRepository')
