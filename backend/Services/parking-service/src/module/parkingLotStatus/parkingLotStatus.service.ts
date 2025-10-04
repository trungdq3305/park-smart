import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { IdDto } from 'src/common/dto/params.dto'

import { ParkingLotStatusResponseDto } from './dto/parkingLotStatus.dto'
import { IParkingLotStatusRepository } from './interfaces/iparkingLotStatus.repository'
import { IParkingLotStatusService } from './interfaces/iparkingLotStatus.service'
import { ParkingLotStatus } from './schemas/parkingLotStatus.schema'

@Injectable()
export class ParkingLotStatusService implements IParkingLotStatusService {
  constructor(
    @Inject(IParkingLotStatusRepository)
    private readonly parkingLotStatusRepository: IParkingLotStatusRepository,
  ) {}

  private returnParkingLotStatusResponseDto(
    parkingLotStatus: ParkingLotStatus,
  ): ParkingLotStatusResponseDto {
    return plainToInstance(ParkingLotStatusResponseDto, parkingLotStatus, {
      excludeExtraneousValues: true,
    })
  }

  async getParkingLotStatusById(
    id: IdDto,
  ): Promise<ParkingLotStatusResponseDto> {
    const status =
      await this.parkingLotStatusRepository.findParkingLotStatusById(id.id)
    if (!status) {
      throw new NotFoundException('Không tìm thấy trạng thái bãi đỗ xe')
    }
    return this.returnParkingLotStatusResponseDto(status)
  }

  async getAllParkingLotStatuses(): Promise<ParkingLotStatusResponseDto[]> {
    const statuses =
      await this.parkingLotStatusRepository.findAllParkingLotStatuses()
    if (statuses.length === 0) {
      throw new NotFoundException('Không tìm thấy trạng thái bãi đỗ xe')
    }
    return statuses.map((status) =>
      this.returnParkingLotStatusResponseDto(status),
    )
  }
}
