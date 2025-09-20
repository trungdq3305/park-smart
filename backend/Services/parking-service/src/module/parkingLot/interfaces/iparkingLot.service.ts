import { ParkingLot } from '../schemas/parkingLot.schema'
import { ParkingLotHistoryLog } from '../schemas/parkingLotHistoryLog.schema'
import {
  CreateParkingLotDto,
  UpdateParkingLotHistoryLogDto,
  CoordinatesDto,
  BoundingBoxDto,
  ParkingLotSpotsUpdateDto,
} from '../dto/parkingLot.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'

export interface IParkingLotService {
  getParkingLotDetails(id: string): Promise<ParkingLot>

  getAllParkingLots(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotSpotsUpdateDto[]; pagination: PaginationDto }>

  findNearbyParkingLots(
    coordinates: CoordinatesDto,
  ): Promise<{ data: ParkingLotSpotsUpdateDto[]; pagination: PaginationDto }>

  findParkingLotsInBounds(
    bounds: BoundingBoxDto,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotSpotsUpdateDto[]; pagination: PaginationDto }>

  getUpdateHistoryForParkingLot(
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
    adminId: string,
  ): Promise<ParkingLot>

  updateAvailableSpots(
    parkingLotId: string,
    change: number,
  ): Promise<ParkingLot>

  deleteParkingLot(id: string): Promise<boolean>
}

export const IParkingLotService = Symbol('IParkingLotService')
