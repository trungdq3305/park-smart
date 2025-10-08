import type { ParkingSpaceResponseDto } from '../dto/parkingSpace.dto'

export interface IParkingSpaceService {
  getAllSpacesByParkingLotId(
    parkingLotId: string,
    level: number,
  ): Promise<ParkingSpaceResponseDto[]>

  findById(id: string): Promise<ParkingSpaceResponseDto>

  updateStatus(
    id: string,
    parkingSpaceStatusId: string,
  ): Promise<ParkingSpaceResponseDto>
}

export const IParkingSpaceService = Symbol('IParkingSpaceService')
