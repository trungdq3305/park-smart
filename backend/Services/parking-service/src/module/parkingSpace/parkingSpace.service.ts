/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common/exceptions'
import { plainToInstance } from 'class-transformer'

import { ParkingSpaceResponseDto } from './dto/parkingSpace.dto'
import { IParkingSpaceRepository } from './interfaces/iparkingSpace.repository'
import { IParkingSpaceService } from './interfaces/iparkingSpace.service'
import { ParkingSpaceGateway } from './parkingSpace.gateway'

@Injectable()
export class ParkingSpaceService implements IParkingSpaceService {
  constructor(
    @Inject(IParkingSpaceRepository)
    private readonly parkingSpaceRepository: IParkingSpaceRepository,
    private readonly parkingSpaceGateway: ParkingSpaceGateway,
  ) {}

  private returnToParkingSpaceResponseDto(data: any) {
    return plainToInstance(ParkingSpaceResponseDto, data, {
      excludeExtraneousValues: true,
    })
  }

  private async getOperatorIdBySpaceId(spaceId: string): Promise<string> {
    const operatorId =
      await this.parkingSpaceRepository.findParkingLotOperatorIdBySpaceId(
        spaceId,
      )
    if (!operatorId) {
      throw new NotFoundException('Không tìm thấy bãi xe cho ô đỗ này')
    }
    return operatorId
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

    const idForRoomName = await this.getOperatorIdBySpaceId(id)

    this.parkingSpaceGateway.sendsParkingSpaceUpdate(`room_${idForRoomName}`, {
      _id: updatedSpace._id,
      parkingSpaceStatusId: {
        _id: parkingSpaceStatusId,
        status: updatedSpace.parkingSpaceStatusId.status,
      },
    })
    
    return this.returnToParkingSpaceResponseDto(updatedSpace)
  }
}
