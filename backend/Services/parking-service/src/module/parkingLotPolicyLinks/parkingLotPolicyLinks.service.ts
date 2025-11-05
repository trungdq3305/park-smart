import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import { Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import {
  CreateParkingLotPolicyLinkDto,
  ParkingLotPolicyLinkResponseDto,
  UpdateParkingLotPolicyLinkDto,
} from './dto/parkingLotPolicyLink.dto'
import { IParkingLotPolicyLinkRepository } from './interfaces/iparkingLotPolicyLink.repository'
import { IParkingLotPolicyLinkService } from './interfaces/iparkingLotPolicyLink.service'
import { ParkingLotPolicyLink } from './schemas/parkingLotPolicyLink.schema'

@Injectable()
export class ParkingLotPolicyLinksService
  implements IParkingLotPolicyLinkService
{
  constructor(
    @Inject(IParkingLotPolicyLinkRepository)
    private readonly parkingLotPolicyLinksRepository: IParkingLotPolicyLinkRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private responseDto(
    parkingLotPolicyLink: ParkingLotPolicyLink,
  ): ParkingLotPolicyLinkResponseDto {
    return plainToInstance(
      ParkingLotPolicyLinkResponseDto,
      parkingLotPolicyLink,
      {
        excludeExtraneousValues: true,
      },
    )
  }

  async createLink(
    createDto: CreateParkingLotPolicyLinkDto,
    userId: string,
  ): Promise<ParkingLotPolicyLinkResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const newLink = await this.parkingLotPolicyLinksRepository.createLink(
        createDto,
        userId,
        session,
      )
      await session.commitTransaction()
      if (!newLink) {
        throw new InternalServerErrorException(
          'Tạo liên kết chính sách bãi xe thất bại! (Vui lòng thử lại)',
        )
      }
      return this.responseDto(newLink)
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  async updateLink(
    id: IdDto,
    updateDto: UpdateParkingLotPolicyLinkDto,
    userId: string,
  ): Promise<boolean> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const updateResult =
        await this.parkingLotPolicyLinksRepository.updateLink(
          id.id,
          updateDto,
          userId,
          session,
        )
      if (!updateResult) {
        throw new InternalServerErrorException(
          'Cập nhật liên kết chính sách bãi xe thất bại! (Vui lòng thử lại)',
        )
      }
      await session.commitTransaction()
      return true
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  async findLinkById(id: IdDto): Promise<ParkingLotPolicyLinkResponseDto> {
    const data = await this.parkingLotPolicyLinksRepository.findLinkById(id.id)
    if (!data) {
      throw new NotFoundException('Không tìm thấy liên kết chính sách bãi xe!')
    }
    return this.responseDto(data)
  }

  async findAllLinksByParkingLot(
    parkingLotId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotPolicyLinkResponseDto[]
    pagination: PaginationDto
  }> {
    const { page, pageSize } = paginationQuery
    const { data, total } =
      await this.parkingLotPolicyLinksRepository.findAllLinksByParkingLot(
        parkingLotId,
        page,
        pageSize,
      )
    return {
      data: data.map((link) => this.responseDto(link)),
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total / pageSize),
        totalItems: total,
      },
    }
  }

  async getActivePoliciesForParkingLot(
    parkingLotId: string,
  ): Promise<ParkingLotPolicyLinkResponseDto[]> {
    const now = new Date()

    // 1. Chỉ cần gọi 1 hàm Repository
    const activeLinks =
      await this.parkingLotPolicyLinksRepository.findActivePolicyLinks(
        parkingLotId,
        now,
      )

    // 2. Chuyển đổi (map) sang DTO và trả về
    // (activeLinks đã được sắp xếp và populate, sẵn sàng để gửi)
    return activeLinks.map(
      (link) => this.responseDto(link), // (Một hàm mapper riêng)
    )
  }

  async softDeleteLink(id: IdDto, userId: string): Promise<boolean> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const deleteResult =
        await this.parkingLotPolicyLinksRepository.softDeleteLink(
          id.id,
          userId,
          session,
        )
      if (!deleteResult) {
        throw new InternalServerErrorException(
          'Xoá liên kết chính sách bãi xe thất bại! (Vui lòng thử lại)',
        )
      }
      await session.commitTransaction()
      return true
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }
}
