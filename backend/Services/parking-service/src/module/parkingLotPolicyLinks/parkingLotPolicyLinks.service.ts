import {
  ConflictException,
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

import { IParkingLotRepository } from '../parkingLot/interfaces/iparkinglot.repository'
import { IPricingPolicyRepository } from '../pricingPolicy/interfaces/ipricingPolicy.repository'
import { IPricingPolicyService } from '../pricingPolicy/interfaces/ipricingPolicy.service'
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
    @Inject(IPricingPolicyRepository)
    private readonly pricingPolicyRepository: IPricingPolicyRepository,
    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,
    @Inject(IPricingPolicyService)
    private readonly pricingPolicyService: IPricingPolicyService,
    @InjectConnection()
    private readonly connection: Connection,
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

  private checkTime(startTime: Date, endTime?: Date): void {
    if (!endTime) {
      return
    }
    if (startTime >= endTime) {
      throw new ConflictException(
        'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc',
      )
    }
  }

  private async checkExist(parkingLotId: string): Promise<void> {
    const existParkingLot =
      await this.parkingLotRepository.findParkingLotById(parkingLotId)

    if (!existParkingLot) {
      throw new NotFoundException('Bãi xe không tồn tại')
    }
  }

  async createLink(
    createDto: CreateParkingLotPolicyLinkDto,
    userId: string,
  ): Promise<ParkingLotPolicyLinkResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const policyId = await this.pricingPolicyService.createPolicy(
        createDto.pricingPolicyId,
        userId,
        session,
      )

      const dataSend: Partial<ParkingLotPolicyLink> = {
        parkingLotId: createDto.parkingLotId,
        pricingPolicyId: policyId._id,
        startDate: new Date(createDto.startDate),
        endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
      }

      await this.checkExist(createDto.parkingLotId)
      this.checkTime(new Date(createDto.startDate), new Date(createDto.endDate))
      const newLink = await this.parkingLotPolicyLinksRepository.createLink(
        dataSend,
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
    isDeleted: boolean,
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
        isDeleted,
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
      const policyLink =
        await this.parkingLotPolicyLinksRepository.findLinkById(id.id)
      if (!policyLink) {
        throw new NotFoundException('Liên kết chính sách bãi xe không tồn tại')
      }
      await this.pricingPolicyService.softDeletePolicyWithCascade(
        policyLink.pricingPolicyId,
        userId,
        session,
      )
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
