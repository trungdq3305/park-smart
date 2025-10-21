import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
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
  ) {}

  private returnTieredRateSetResponseDto(
    tieredRateSet: TieredRateSet,
  ): TieredRateSetResponseDto {
    return plainToInstance(TieredRateSetResponseDto, tieredRateSet, {
      excludeExtraneousValues: true,
    })
  }

  private async checkIsUsed(id: string): Promise<boolean> {
    const tieredRateSet = await this.tieredRateSetRepository.findSetById(id)
    if (!tieredRateSet) {
      throw new InternalServerErrorException('Không tìm thấy bộ giá bậc thang')
    }
    return tieredRateSet.isUsed
  }

  private async checkDuplicateName(
    name: string,
    userId: string,
  ): Promise<void> {
    const existsSet = await this.tieredRateSetRepository.findSetByName(
      name,
      userId,
    )

    if (existsSet) {
      throw new ConflictException('Đã tồn tại bộ giá bậc thang với tên này')
    }
  }

  async createSet(
    createDto: CreateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSetResponseDto> {
    await this.checkDuplicateName(createDto.name, userId)
    const createdSet = await this.tieredRateSetRepository.createSet(
      createDto,
      userId,
    )
    if (!createdSet) {
      throw new InternalServerErrorException('Tạo bộ giá bậc thang thất bại')
    }
    return this.returnTieredRateSetResponseDto(createdSet)
  }

  async updateSet(
    id: IdDto,
    updateDto: UpdateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSetResponseDto> {
    if (updateDto.name) {
      await this.checkDuplicateName(updateDto.name, userId)
    }
    const isUsed = await this.checkIsUsed(id.id)
    if (isUsed) {
      throw new ConflictException(
        'Không thể cập nhật bộ giá bậc thang đang được sử dụng',
      )
    }
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
    const isUsed = await this.checkIsUsed(id.id)
    if (isUsed) {
      throw new ConflictException(
        'Không thể cập nhật bộ giá bậc thang đang được sử dụng',
      )
    }
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
