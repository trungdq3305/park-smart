import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type {
  IdDto,
  ParkingLotIdDto,
  ParkingLotStatusIdDto,
} from 'src/common/dto/params.dto'

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
  getParkingLotDetails(id: IdDto): Promise<ParkingLotResponseDto>

  getAllParkingLots(
    paginationQuery: PaginationQueryDto,
    parkingLotStatusId: string,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  findNearbyParkingLots(
    coordinates: CoordinatesDto,
    paginationQuery: PaginationQueryDto,
    maxDistanceInKm: number,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  findParkingLotsInBounds(
    bounds: BoundingBoxDto,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  getUpdateHistoryLogForParkingLot(
    parkingLotId: ParkingLotIdDto,
  ): Promise<ParkingLotHistoryLog[]>

  createParkingLot(
    createDto: CreateParkingLotDto,
    userId: string,
    currentIdOfUserRole: string,
  ): Promise<ParkingLotResponseDto>

  requestParkingLotUpdate(
    parkingLotId: ParkingLotIdDto,
    updateRequestDto: UpdateParkingLotHistoryLogDto,
    userId: string,
  ): Promise<ParkingLotHistoryLog>

  approveNewParkingLot(
    parkingLotId: ParkingLotIdDto,
    statusId: ParkingLotStatusIdDto,
    userId: string,
  ): Promise<ParkingLot>

  updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<ParkingLot>

  deleteParkingLot(id: IdDto, userId: string): Promise<boolean>
}

export const IParkingLotService = Symbol('IParkingLotService')
