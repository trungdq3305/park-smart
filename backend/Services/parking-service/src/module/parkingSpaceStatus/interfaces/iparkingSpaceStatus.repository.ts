import type { ParkingSpaceStatus } from '../schemas/parkingSpaceStatus.schema'

export interface IParkingSpaceStatusRepository {
  findParkingSpaceStatusById(id: string): Promise<ParkingSpaceStatus | null>
  findAllParkingSpaceStatuses(): Promise<ParkingSpaceStatus[]>
  findParkingSpaceStatusByStatus(status: string): Promise<string | null>
}

export const IParkingSpaceStatusRepository = Symbol(
  'IParkingSpaceStatusRepository',
)
