import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import { ClientSession, Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { IBasisRepository } from '../basis/interfaces/ibasis.repository'
import { IPackageRateService } from '../packageRate/interfaces/ipackageRate.service'
import { ITieredRateSetService } from '../tieredRateSet/interfaces/itieredRateSet.service'
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
    @Inject(ITieredRateSetService)
    private readonly tieredRateSetService: ITieredRateSetService,
    @Inject(IPackageRateService)
    private readonly packageRateService: IPackageRateService,
    @Inject(IBasisRepository)
    private readonly basisRepository: IBasisRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async softDeletePolicyWithCascade(
    policyId: string,
    userId: string,
    session: ClientSession,
  ): Promise<void> {
    // 1. Tìm Policy để lấy ID của các RateSets con
    const policy = await this.pricingPolicyRepository.findPolicyById(policyId) // Bạn cần đảm bảo repo có hàm findById

    if (!policy) {
      // Nếu không tìm thấy policy thì thôi, không cần lỗi, coi như đã xóa
      return
    }

    // 2. Xóa TieredRateSet (nếu có)
    if (policy.tieredRateSetId) {
      await this.tieredRateSetService.softDelete(
        // Giả sử bạn đã có hàm softDelete bên service này
        policy.tieredRateSetId,
        userId,
        session, // Truyền session
      )
    }

    // 3. Xóa PackageRate (nếu có)
    if (policy.packageRateId) {
      await this.packageRateService.softDelete(
        // Giả sử bạn đã có hàm softDelete bên service này
        policy.packageRateId,
        userId,
        session, // Truyền session
      )
    }

    // 4. Xóa chính Policy
    await this.pricingPolicyRepository.softDeletePolicy(
      // Hàm softDelete của repo policy
      policyId,
      userId,
      session,
    )
  }

  private returnToPricingPolicyResponseDto(data: PricingPolicy) {
    return plainToInstance(PricingPolicyResponseDto, data, {
      excludeExtraneousValues: true,
    })
  }

  async createPolicy(
    createDto: CreatePricingPolicyDto,
    userId: string,
    externalSession?: ClientSession, // <--- Thêm tham số này (nhớ import ClientSession từ mongoose)
  ): Promise<PricingPolicyResponseDto> {
    const basis = await this.basisRepository.findBasisById(createDto.basisId)
    if (!basis) {
      throw new NotFoundException('Cơ sở tính giá không tồn tại.')
    }

    // 1. Dùng cleanData
    const cleanData: Partial<CreatePricingPolicyDto> = { ...createDto }
    const createData: Partial<PricingPolicy> = { ...createDto }

    // 2. Logic "công tắc"
    switch (basis.basisName) {
      case 'HOURLY':
        if (!cleanData.pricePerHour) {
          throw new BadRequestException(
            'Phải cung cấp "pricePerHour" cho cơ sở HOURLY.',
          )
        }
        cleanData.fixedPrice = undefined
        cleanData.packageRate = undefined
        cleanData.tieredRateSet = undefined
        break

      case 'FIXED':
        if (!cleanData.fixedPrice) {
          throw new BadRequestException(
            'Phải cung cấp "fixedPrice" cho cơ sở FIXED.',
          )
        }
        cleanData.pricePerHour = undefined
        cleanData.packageRate = undefined
        cleanData.tieredRateSet = undefined
        break

      case 'PACKAGE':
        if (!cleanData.packageRate) {
          throw new BadRequestException(
            'Phải cung cấp "packageRateSetId" cho cơ sở PACKAGE.',
          )
        }
        cleanData.pricePerHour = undefined
        cleanData.fixedPrice = undefined
        cleanData.tieredRateSet = undefined
        break

      case 'TIERED':
        if (!cleanData.tieredRateSet) {
          throw new BadRequestException(
            'Phải cung cấp "tieredRateSet" cho cơ sở TIERED.',
          )
        }
        cleanData.pricePerHour = undefined
        cleanData.fixedPrice = undefined
        cleanData.packageRate = undefined
        break
    }

    // 3. Xử lý Session: Dùng cái bên ngoài truyền vào hoặc tạo mới
    const session = externalSession ?? (await this.connection.startSession())

    // Chỉ start transaction nếu session này do hàm này tự tạo ra
    if (!externalSession) {
      session.startTransaction()
    }

    try {
      // 4. Dùng cleanData để kiểm tra & cập nhật trạng thái
      if (cleanData.tieredRateSet) {
        // Gọi service tạo set (đã dùng session chung)
        const createdTieredSet = await this.tieredRateSetService.createSet(
          cleanData.tieredRateSet, // Đang là Object DTO
          userId,
          session,
        )

        // ✅ CẬP NHẬT LẠI: Thay thế Object bằng ID vừa tạo
        createData.tieredRateSetId = createdTieredSet._id
      }

      // 5. Xử lý Package Rate (Nếu có)
      if (cleanData.packageRate) {
        // Gọi service tạo package (đã dùng session chung)
        const createdPackage = await this.packageRateService.createPackageRate(
          cleanData.packageRate, // Đang là Object DTO
          userId,
          session,
        )

        // ✅ CẬP NHẬT LẠI: Thay thế Object bằng ID vừa tạo
        createData.packageRateId = createdPackage._id
      }

      // 6. Dùng cleanData để tạo Policy
      const newPolicy = await this.pricingPolicyRepository.createPolicy(
        createData as CreatePricingPolicyDto,
        userId,
        session, // Dùng session chung
      )

      if (!newPolicy) {
        throw new InternalServerErrorException(
          'Không thể tạo chính sách giá mới.',
        )
      }

      // Chỉ commit nếu session là nội bộ (không phải từ bên ngoài truyền vào)
      if (!externalSession) {
        await session.commitTransaction()
      }

      return this.returnToPricingPolicyResponseDto(newPolicy)
    } catch (error) {
      // Chỉ abort nếu session là nội bộ
      if (!externalSession) {
        await session.abortTransaction()
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error
      }
      throw new InternalServerErrorException('Lỗi khi tạo chính sách giá.')
    } finally {
      // Chỉ end session nếu session là nội bộ
      if (!externalSession) {
        await session.endSession()
      }
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

  softDeletePolicy(id: IdDto, userId: string): Promise<boolean> {
    return this.pricingPolicyRepository.softDeletePolicy(id.id, userId)
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
