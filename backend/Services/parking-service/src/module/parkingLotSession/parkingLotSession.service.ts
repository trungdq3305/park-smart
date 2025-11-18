import { Inject, Injectable } from '@nestjs/common'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

import {
  CreateParkingSessionDto,
  ParkingLotSessionResponseDto,
} from './dto/parkingLotSession.dto'
import { IParkingLotSessionRepository } from './interfaces/iparkingLotSession.repository'
import { IParkingLotSessionService } from './interfaces/iparkingLotSession.service'

@Injectable()
export class ParkingLotSessionService implements IParkingLotSessionService {
  constructor(
    @Inject(IParkingLotSessionRepository)
    private readonly parkingLotSessionRepository: IParkingLotSessionRepository,
  ) {}

  checkInWalkIn(
    parkingLotId: string,
    createDto: CreateParkingSessionDto,
    file: Express.Multer.File,
  ): Promise<ParkingLotSessionResponseDto> {
    throw new Error('Method not implemented.')
  }

  calculateWalkInCheckoutFee(
    plateNumber: string,
    parkingLotId: string,
  ): Promise<any> {
    throw new Error('Method not implemented.')
  }

  confirmWalkInCheckout(
    sessionId: string,
    paymentId: string,
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  findAllSessionsByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotSessionResponseDto[]
    pagination: PaginationDto
  }> {
    throw new Error('Method not implemented.')
  }

  findAllSessionsByParkingLot(
    parkingLotId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotSessionResponseDto[]
    pagination: PaginationDto
  }> {
    throw new Error('Method not implemented.')
  }

  getSessionDetailsWithImages(
    sessionId: string,
  ): Promise<ParkingLotSessionResponseDto & { images: any[] }> {
    throw new Error('Method not implemented.')
  }
}
