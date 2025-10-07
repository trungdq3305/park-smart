import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { IdDto } from 'src/common/dto/params.dto'

import { ParkingSpaceStatusResponseDto } from './dto/parkingSpaceStatus.dto'
import { IParkingSpaceStatusRepository } from './interfaces/iparkingSpaceStatus.repository'
import { IParkingSpaceStatusService } from './interfaces/iparkingSpaceStatus.service'
import { ParkingSpaceStatus } from './schemas/parkingSpaceStatus.schema'

@Injectable()
export class ParkingSpaceStatusService implements IParkingSpaceStatusService {
  constructor(
    @Inject(IParkingSpaceStatusRepository)
    private readonly parkingSpaceStatusRepository: IParkingSpaceStatusRepository,
  ) {}

  private returnParkingSpaceStatusResponseDto(
    parkingSpaceStatus: ParkingSpaceStatus,
  ): ParkingSpaceStatusResponseDto {
    return plainToInstance(ParkingSpaceStatusResponseDto, parkingSpaceStatus, {
      excludeExtraneousValues: true,
    })
  }

  async getParkingSpaceStatusById(
    id: IdDto,
  ): Promise<ParkingSpaceStatusResponseDto> {
    const status =
      await this.parkingSpaceStatusRepository.findParkingSpaceStatusById(id.id)
    if (!status) {
      throw new NotFoundException('Không tìm thấy trạng thái ô đỗ xe')
    }
    return this.returnParkingSpaceStatusResponseDto(status)
  }

  async getAllParkingSpaceStatuses(): Promise<ParkingSpaceStatusResponseDto[]> {
    const statuses =
      await this.parkingSpaceStatusRepository.findAllParkingSpaceStatuses()
    if (statuses.length === 0) {
      throw new NotFoundException('Không tìm thấy trạng thái ô đỗ xe')
    }
    return statuses.map((status) =>
      this.returnParkingSpaceStatusResponseDto(status),
    )
  }
}
