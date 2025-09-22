import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

import type {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDto,
  ParkingLotResponseDto,
  UpdateParkingLotHistoryLogDto,
} from '../dto/parkingLot.dto'
import type { ParkingLot } from '../schemas/parkingLot.schema'
import type { ParkingLotHistoryLog } from '../schemas/parkingLotHistoryLog.schema'

export interface IParkingLotService {
  getParkingLotDetails(id: string): Promise<ParkingLot>

  getAllParkingLots(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  findNearbyParkingLots(
    coordinates: CoordinatesDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  findParkingLotsInBounds(
    bounds: BoundingBoxDto,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  getUpdateHistoryLogForParkingLot(
    parkingLotId: string,
  ): Promise<ParkingLotHistoryLog[]>

  createParkingLot(
    createDto: CreateParkingLotDto,
    userId: string,
  ): Promise<ParkingLot>

  requestParkingLotUpdate(
    parkingLotId: string,
    updateRequestDto: UpdateParkingLotHistoryLogDto,
    userId: string,
  ): Promise<ParkingLotHistoryLog>

  approveNewParkingLot(
    parkingLotId: string,
    isApproved: boolean,
    userId: string,
  ): Promise<ParkingLot>

  updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<ParkingLot>

  deleteParkingLot(id: string, userId: string): Promise<boolean>
}

export const IParkingLotService = Symbol('IParkingLotService')
