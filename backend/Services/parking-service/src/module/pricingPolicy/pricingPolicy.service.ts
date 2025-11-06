import {
  BadRequestException,
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

import { IPackageRateRepository } from '../packageRate/interfaces/ipackageRate.repository'
import { ITieredRateSetRepository } from '../tieredRateSet/interfaces/itieredRateSet.repository'
// Import các DTOs liên quan đến PricingPolicy
import {
  CreatePricingPolicyDto,
  PricingPolicyResponseDto, // Giả định tên DTO response
} from './dto/pricingPolicy.dto'
import { IPricingPolicyRepository } from './interfaces/ipricingPolicy.repository'
import { IPricingPolicyService } from './interfaces/ipricingPolicy.service'
import { PricingPolicy } from './schemas/pricingPolicy.schema'

@Injectable()
export class PricingPolicyService implements IPricingPolicyService {
  constructor(
    @Inject(IPricingPolicyRepository)
    private readonly pricingPolicyRepository: IPricingPolicyRepository,
    @Inject(ITieredRateSetRepository)
    private readonly tieredRateSetRepository: ITieredRateSetRepository,
    @Inject(IPackageRateRepository)
    private readonly packageRateRepository: IPackageRateRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private returnToPricingPolicyResponseDto(data: PricingPolicy) {
    return plainToInstance(PricingPolicyResponseDto, data, {
      excludeExtraneousValues: true,
    })
  }

  async createPolicy(
    createDto: CreatePricingPolicyDto,
    userId: string,
  ): Promise<PricingPolicyResponseDto> {
    if (!createDto.tieredRateSetId && !createDto.packageRateSetId) {
      throw new BadRequestException( // <-- 2. Thay thế
        'Phải cung cấp ít nhất một trong hai: tieredRateSetId hoặc packageRateSetId.',
      )
    }
    if (createDto.tieredRateSetId && createDto.packageRateSetId) {
      throw new BadRequestException( // <-- 2. Thay thế
        'Chỉ được cung cấp một trong hai: tieredRateSetId hoặc packageRateSetId.',
      )
    }
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      if (createDto.tieredRateSetId) {
        const tieredSet =
          await this.tieredRateSetRepository.findSetByIdAndCreator(
            createDto.tieredRateSetId,
            userId,
          )
        if (!tieredSet) {
          throw new NotFoundException( // <-- 2. Thay thế
            'Bộ giá bậc thang không tồn tại hoặc không thuộc về bạn.',
          )
        }
        await this.tieredRateSetRepository.setTieredRateSetAsUsed(
          createDto.tieredRateSetId,
          true,
          session,
        )
      }
      if (createDto.packageRateSetId) {
        const packageRateSet =
          await this.packageRateRepository.findPackageRateByIdAndCreator(
            createDto.packageRateSetId,
            userId,
          )
        if (!packageRateSet) {
          throw new NotFoundException( // <-- 2. Thay thế
            'Bộ giá theo gói không tồn tại hoặc không thuộc về bạn.',
          )
        }
        await this.packageRateRepository.setPackageRateInUsed(
          createDto.packageRateSetId,
          true,
          session,
        )
      }
      const newPolicy = await this.pricingPolicyRepository.createPolicy(
        createDto,
        userId,
        session,
      )
      if (!newPolicy) {
        throw new InternalServerErrorException( // <-- 2. Thay thế
          'Không thể tạo chính sách giá mới.',
        )
      }
      await session.commitTransaction()
      return this.returnToPricingPolicyResponseDto(newPolicy)
    } catch (error) {
      await session.abortTransaction()
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error
      }
      throw new InternalServerErrorException('Lỗi khi tạo chính sách giá.')
    } finally {
      await session.endSession()
    }
  }

  async getPolicyDetails(id: IdDto): Promise<PricingPolicyResponseDto> {
    const policy = await this.pricingPolicyRepository.findPolicyById(id.id)
    if (!policy) {
      throw new NotFoundException('Không tìm thấy chính sách giá.') // <-- 2. Thay thế
    }
    return this.returnToPricingPolicyResponseDto(policy)
  }

  async findAllPoliciesByCreator(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PricingPolicyResponseDto[]; pagination: PaginationDto }> {
    const { page, pageSize } = paginationQuery
    const policiesData =
      await this.pricingPolicyRepository.findAllPoliciesByPoliciesByCreator(
        userId,
        page,
        pageSize,
      )
    const policiesDto = policiesData.data.map((policy) =>
      this.returnToPricingPolicyResponseDto(policy),
    )
    return {
      data: policiesDto,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(policiesData.total / pageSize),
        totalItems: policiesData.total,
      },
    }
  }

  async softDeletePolicy(id: IdDto, userId: string): Promise<boolean> {
    const existingPolicy = await this.pricingPolicyRepository.findPolicyById(
      id.id,
    )
    if (!existingPolicy) {
      throw new NotFoundException('Không tìm thấy chính sách giá.') // <-- 2. Thay thế
    }
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      if (existingPolicy.tieredRateSetId) {
        const countTieredRate =
          await this.pricingPolicyRepository.countOtherPoliciesUsingTieredRate(
            existingPolicy.tieredRateSetId || '',
            existingPolicy._id,
            session,
          )
        if (countTieredRate === 0 && existingPolicy.tieredRateSetId) {
          const markTieredRate =
            await this.tieredRateSetRepository.setTieredRateSetAsUsed(
              existingPolicy.tieredRateSetId,
              false,
              session,
            )
          if (!markTieredRate) {
            throw new InternalServerErrorException(
              'Đã có lỗi xảy ra khi xóa, vui lòng thử lại sau.',
            )
          }
        }
      }
      if (existingPolicy.packageRateId) {
        const countPackageRate =
          await this.pricingPolicyRepository.countOtherPoliciesUsingPackageRate(
            existingPolicy.packageRateId || '',
            existingPolicy._id,
            session,
          )
        if (countPackageRate === 0 && existingPolicy.packageRateId) {
          const markPackageRate =
            await this.packageRateRepository.setPackageRateInUsed(
              existingPolicy.packageRateId,
              false,
              session,
            )
          if (!markPackageRate) {
            throw new InternalServerErrorException(
              'Đã có lỗi xảy ra khi xóa, vui lòng thử lại sau.',
            )
          }
        }
      }
      const result = await this.pricingPolicyRepository.softDeletePolicy(
        id.id,
        userId,
      )
      if (!result) {
        throw new InternalServerErrorException(
          'Đã có lỗi xảy ra khi xóa, vui lòng thử lại sau.',
        )
      }
      await session.commitTransaction()
      return result
    } catch (error) {
      await session.abortTransaction()
      if (error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('Lỗi khi xóa chính sách giá.')
    } finally {
      await session.endSession()
    }
  }

  async findAllPoliciesForAdmin(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PricingPolicyResponseDto[]; pagination: PaginationDto }> {
    const { page, pageSize } = paginationQuery
    const policiesData =
      await this.pricingPolicyRepository.findAllPoliciesForAdmin(page, pageSize)
    const policiesDto = policiesData.data.map((policy) =>
      this.returnToPricingPolicyResponseDto(policy),
    )
    return {
      data: policiesDto,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(policiesData.total / pageSize),
        totalItems: policiesData.total,
      },
    }
  }
}
