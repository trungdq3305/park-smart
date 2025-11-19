import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import { ClientSession, Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

// Import các DTOs liên quan đến TieredRateSet
import {
  CreateTieredRateSetDto,
  TieredRateSetResponseDto, // Giả định tên DTO response
  UpdateTieredRateSetDto,
} from './dto/tieredRateSet.dto'
import { ITieredRateSetRepository } from './interfaces/itieredRateSet.repository'
import { ITieredRateSetService } from './interfaces/itieredRateSet.service'
import { TieredRateSet } from './schemas/tieredRateSet.schema'

@Injectable()
export class TieredRateSetService implements ITieredRateSetService {
  constructor(
    @Inject(ITieredRateSetRepository)
    private readonly tieredRateSetRepository: ITieredRateSetRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  softDelete(
    id: string,
    userId: string,
    session: ClientSession,
  ): Promise<boolean> {
    return this.tieredRateSetRepository.softDeleteSet(id, userId, session)
  }

  private returnTieredRateSetResponseDto(
    tieredRateSet: TieredRateSet,
  ): TieredRateSetResponseDto {
    return plainToInstance(TieredRateSetResponseDto, tieredRateSet, {
      excludeExtraneousValues: true,
    })
  }

  async createSet(
    createDto: CreateTieredRateSetDto,
    userId: string,
    externalSession?: ClientSession, // Nhận session từ createPolicy
  ): Promise<TieredRateSetResponseDto> {
    // 1. Xử lý Session
    const session = externalSession ?? (await this.connection.startSession())
    if (!externalSession) {
      session.startTransaction()
    }

    try {
      // 2. Truyền session vào Repository
      const createdSet = await this.tieredRateSetRepository.createSet(
        createDto,
        userId,
        session, // <--- QUAN TRỌNG
      )
      if (!createdSet) {
        throw new InternalServerErrorException('Tạo bộ giá bậc thang thất bại')
      }

      // 3. Chỉ commit nếu tự quản lý session
      if (!externalSession) {
        await session.commitTransaction()
      }

      return this.returnTieredRateSetResponseDto(createdSet)
    } catch (error) {
      // 4. Chỉ abort nếu tự quản lý session
      if (!externalSession) {
        await session.abortTransaction()
      }
      throw error
    } finally {
      // 5. Chỉ end nếu tự quản lý session
      if (!externalSession) {
        await session.endSession()
      }
    }
  }

  async updateSet(
    id: IdDto,
    updateDto: UpdateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSetResponseDto> {
    const updatedSet = await this.tieredRateSetRepository.updateSet(
      id.id,
      updateDto,
      userId,
    )
    if (!updatedSet) {
      throw new InternalServerErrorException(
        'Cập nhật bộ giá bậc thang thất bại',
      )
    }
    return this.returnTieredRateSetResponseDto(updatedSet)
  }

  async findSetById(id: IdDto): Promise<TieredRateSetResponseDto> {
    const tieredRateSet = await this.tieredRateSetRepository.findSetById(id.id)
    if (!tieredRateSet) {
      throw new InternalServerErrorException('Không tìm thấy bộ giá bậc thang')
    }
    return this.returnTieredRateSetResponseDto(tieredRateSet)
  }

  async findAllSetsByCreator(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: TieredRateSetResponseDto[]; pagination: PaginationDto }> {
    const { page, pageSize } = paginationQuery
    const data = await this.tieredRateSetRepository.findAllSetsByCreator(
      userId,
      page,
      pageSize,
    )
    return {
      data: data.data.map((set) => this.returnTieredRateSetResponseDto(set)),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: data.total,
        totalPages: Math.ceil(data.total / pageSize),
      },
    }
  }

  async softDeleteSet(id: IdDto, userId: string): Promise<boolean> {
    const data = await this.tieredRateSetRepository.softDeleteSet(id.id, userId)
    if (!data) {
      throw new InternalServerErrorException('Xoá bộ giá bậc thang thất bại')
    }
    return data
  }

  async findAllSetsForAdmin(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: TieredRateSetResponseDto[]; pagination: PaginationDto }> {
    const { page, pageSize } = paginationQuery
    const data = await this.tieredRateSetRepository.findAllSetsForAdmin(
      page,
      pageSize,
    )
    if (data.data.length === 0) {
      throw new NotFoundException('Không tìm thấy bộ giá bậc thang nào')
    }
    return {
      data: data.data.map((set) => this.returnTieredRateSetResponseDto(set)),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: data.total,
        totalPages: Math.ceil(data.total / pageSize),
      },
    }
  }
}
