import { Inject, Injectable } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common/exceptions'
import { plainToInstance } from 'class-transformer'

import { ParkingSpaceResponseDto } from './dto/parkingSpace.dto'
import { IParkingSpaceRepository } from './interfaces/iparkingSpace.repository'
import { IParkingSpaceService } from './interfaces/iparkingSpace.service'
import { ParkingSpace } from './schemas/parkingSpace.schema'

@Injectable()
export class ParkingSpaceService implements IParkingSpaceService {
  constructor(
    @Inject(IParkingSpaceRepository)
    private readonly parkingSpaceRepository: IParkingSpaceRepository,
  ) {}

  private returnToParkingSpaceResponseDto(data: ParkingSpace) {
    return plainToInstance(ParkingSpaceResponseDto, data, {
      excludeExtraneousValues: true,
    })
  }

  async getAllSpacesByParkingLotId(
    parkingLotId: string,
    level: number,
  ): Promise<ParkingSpaceResponseDto[]> {
    const spaces = await this.parkingSpaceRepository.findByParkingLotId(
      parkingLotId,
      level,
    )
    if (spaces.length === 0) {
      throw new NotFoundException('Không tìm thấy ô đỗ nào trong bãi xe này')
    }
    return spaces.map((space) => this.returnToParkingSpaceResponseDto(space))
  }

  async findById(id: string): Promise<ParkingSpaceResponseDto> {
    const space = await this.parkingSpaceRepository.findById(id)
    if (!space) {
      throw new NotFoundException('Không tìm thấy ô đỗ này')
    }
    return this.returnToParkingSpaceResponseDto(space)
  }

  async updateStatus(
    id: string,
    parkingSpaceStatusId: string,
  ): Promise<ParkingSpaceResponseDto> {
    const existingSpace = await this.parkingSpaceRepository.findById(id)
    if (!existingSpace) {
      throw new NotFoundException('Không tìm thấy ô đỗ này')
    }
    const updatedSpace = await this.parkingSpaceRepository.updateStatus(
      id,
      parkingSpaceStatusId,
    )
    if (!updatedSpace) {
      throw new NotFoundException('Cập nhật trạng thái ô đỗ thất bại')
    }
    return this.returnToParkingSpaceResponseDto(updatedSpace)
  }
}
