import { Inject, Injectable } from '@nestjs/common'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

import {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDto,
  ParkingLotResponseDto,
} from './dto/parkingLot.dto'
import { UpdateParkingLotHistoryLogDto } from './dto/parkingLot.dto'
import { IParkingLotRepository } from './interfaces/iparkinglot.repository'
import { IParkingLotService } from './interfaces/iparkingLot.service'
import { IParkingLotHistoryLogRepository } from './interfaces/iparkingLotHistoryLog.repository'
import { ParkingLotGateway } from './parkingLot.gateway'
import { ParkingLot } from './schemas/parkingLot.schema'
import { ParkingLotHistoryLog } from './schemas/parkingLotHistoryLog.schema'

@Injectable()
export class ParkingLotService implements IParkingLotService {
  constructor(
    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,
    @Inject(IParkingLotHistoryLogRepository)
    private readonly parkingLotHistoryLogRepository: IParkingLotHistoryLogRepository,
    private readonly parkingLotGateway: ParkingLotGateway,
  ) {}
  getParkingLotDetails(id: string): Promise<ParkingLot> {
    throw new Error('Method not implemented.')
  }
  getAllParkingLots(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }> {
    throw new Error('Method not implemented.')
  }
  findNearbyParkingLots(
    coordinates: CoordinatesDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }> {
    throw new Error('Method not implemented.')
  }
  findParkingLotsInBounds(
    bounds: BoundingBoxDto,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }> {
    throw new Error('Method not implemented.')
  }
  getUpdateHistoryLogForParkingLot(
    parkingLotId: string,
  ): Promise<ParkingLotHistoryLog[]> {
    throw new Error('Method not implemented.')
  }
  createParkingLot(
    createDto: CreateParkingLotDto,
    userId: string,
  ): Promise<ParkingLot> {
    throw new Error('Method not implemented.')
  }
  requestParkingLotUpdate(
    parkingLotId: string,
    updateRequestDto: UpdateParkingLotHistoryLogDto,
    userId: string,
  ): Promise<ParkingLotHistoryLog> {
    throw new Error('Method not implemented.')
  }
  approveNewParkingLot(
    parkingLotId: string,
    isApproved: boolean,
    userId: string,
  ): Promise<ParkingLot> {
    throw new Error('Method not implemented.')
  }
  updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<ParkingLot> {
    throw new Error('Method not implemented.')
  }
  deleteParkingLot(id: string, userId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
}
