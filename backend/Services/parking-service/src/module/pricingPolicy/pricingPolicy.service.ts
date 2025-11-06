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

import { IBasisRepository } from '../basis/interfaces/ibasis.repository'
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
    @Inject(IBasisRepository)
    private readonly basisRepository: IBasisRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private returnToPricingPolicyResponseDto(data: PricingPolicy) {
    return plainToInstance(PricingPolicyResponseDto, data, {
      excludeExtraneousValues: true,
    })
  }

  private async checkExist(
    tieredRateSetId: string | null,
    packageRateId: string | null,
  ): Promise<void> {
    // Logic kiểm tra sự tồn tại của tieredRateSetId, packageRateId
    // Nếu không tồn tại, ném ra NotFoundException với thông báo phù hợp
    if (tieredRateSetId) {
      const tieredRateSetExist =
        await this.tieredRateSetRepository.findSetById(tieredRateSetId)
      if (!tieredRateSetExist) {
        throw new NotFoundException('Tiered Rate Set ID không tồn tại.')
      }
    }
    if (packageRateId) {
      const packageRateExist =
        await this.packageRateRepository.findPackageRateById(packageRateId)
      if (!packageRateExist) {
        throw new NotFoundException('Package Rate ID không tồn tại.')
      }
    }
  }

  async createPolicy(
    createDto: CreatePricingPolicyDto,
    userId: string,
  ): Promise<PricingPolicyResponseDto> {
    const existName = await this.pricingPolicyRepository.findByNameAndCreator(
      createDto.name,
      userId,
    )
    if (existName) {
      throw new BadRequestException(
        'Tên chính sách giá đã tồn tại, vui lòng chọn tên khác.',
      )
    }
    await this.checkExist(createDto.tieredRateSetId, createDto.packageRateId)

    const basis = await this.basisRepository.findBasisById(createDto.basisId)
    if (!basis) {
      throw new NotFoundException('Cơ sở tính giá không tồn tại.')
    }

    // 1. Dùng cleanData
    const cleanData: Partial<CreatePricingPolicyDto> = { ...createDto }

    // 2. Logic "công tắc" (Phần này đã đúng)
    switch (basis.basisName) {
      case 'HOURLY':
        if (!cleanData.pricePerHour) {
          throw new BadRequestException(
            'Phải cung cấp "pricePerHour" cho cơ sở HOURLY.',
          )
        }
        cleanData.fixedPrice = undefined
        cleanData.packageRateId = undefined
        cleanData.tieredRateSetId = undefined
        break

      case 'FIXED':
        if (!cleanData.fixedPrice) {
          throw new BadRequestException(
            'Phải cung cấp "fixedPrice" cho cơ sở FIXED.',
          )
        }
        cleanData.pricePerHour = undefined
        cleanData.packageRateId = undefined
        cleanData.tieredRateSetId = undefined
        break

      case 'PACKAGE':
        if (!cleanData.packageRateId) {
          throw new BadRequestException(
            'Phải cung cấp "packageRateSetId" cho cơ sở PACKAGE.',
          )
        }
        cleanData.pricePerHour = undefined
        cleanData.fixedPrice = undefined
        cleanData.tieredRateSetId = undefined
        break

      case 'TIERED':
        if (!cleanData.tieredRateSetId) {
          throw new BadRequestException(
            'Phải cung cấp "tieredRateSetId" cho cơ sở TIERED.',
          )
        }
        cleanData.pricePerHour = undefined
        cleanData.fixedPrice = undefined
        cleanData.packageRateId = undefined
        break
    }

    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      // 4. ✅ SỬA: Dùng cleanData để kiểm tra
      if (cleanData.tieredRateSetId) {
        const tieredSet =
          await this.tieredRateSetRepository.findSetByIdAndCreator(
            cleanData.tieredRateSetId, // ✅ Sửa
            userId,
          )
        if (!tieredSet) {
          throw new NotFoundException(
            'Bộ giá bậc thang không tồn tại hoặc không thuộc về bạn.',
          )
        }
        await this.tieredRateSetRepository.setTieredRateSetAsUsed(
          cleanData.tieredRateSetId, // ✅ Sửa
          true,
          session,
        )
      }

      // 5. ✅ SỬA: Dùng cleanData để kiểm tra
      if (cleanData.packageRateId) {
        const packageRateSet =
          await this.packageRateRepository.findPackageRateByIdAndCreator(
            cleanData.packageRateId, // ✅ Sửa
            userId,
          )
        if (!packageRateSet) {
          throw new NotFoundException(
            'Bộ giá theo gói không tồn tại hoặc không thuộc về bạn.',
          )
        }
        await this.packageRateRepository.setPackageRateInUsed(
          cleanData.packageRateId, // ✅ Sửa
          true,
          session,
        )
      }

      // 6. ✅ SỬA: Dùng cleanData để tạo
      const newPolicy = await this.pricingPolicyRepository.createPolicy(
        cleanData as CreatePricingPolicyDto, // ✅ Sửa: Dùng dữ liệu sạch
        userId,
        session,
      )

      if (!newPolicy) {
        throw new InternalServerErrorException(
          'Không thể tạo chính sách giá mới.',
        )
      }

      await session.commitTransaction()
      return this.returnToPricingPolicyResponseDto(newPolicy)
    } catch (error) {
      await session.abortTransaction()
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException // Thêm lỗi 500
      ) {
        throw error
      }
      console.log(error)
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
