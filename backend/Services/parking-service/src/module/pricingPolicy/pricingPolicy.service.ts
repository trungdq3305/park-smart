/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
    externalSession?: ClientSession,
  ): Promise<PricingPolicyResponseDto> {
    const basis = await this.basisRepository.findBasisById(createDto.basisId)
    if (!basis) {
      throw new NotFoundException('Cơ sở tính giá không tồn tại.')
    }

    // 1. Tạo một biến payload duy nhất từ DTO để xử lý dữ liệu sẽ lưu
    // Dùng type any hoặc Partial<PricingPolicy> để linh hoạt việc xóa/thêm trường
    const policyPayload: any = { ...createDto }

    // 2. Logic "công tắc" - Dọn dẹp dữ liệu dựa trên Basis
    // Lưu ý: Kiểm tra dữ liệu đầu vào từ 'createDto' (nguồn gốc), sửa đổi trên 'policyPayload' (đích)
    switch (basis.basisName) {
      case 'HOURLY':
        if (!createDto.pricePerHour) {
          throw new BadRequestException(
            'Phải cung cấp "pricePerHour" cho cơ sở HOURLY.',
          )
        }
        // Xóa các trường không liên quan
        delete policyPayload.fixedPrice
        delete policyPayload.packageRateId
        delete policyPayload.packageRate // Xóa luôn object DTO nếu có
        delete policyPayload.tieredRateSetId
        delete policyPayload.tieredRateSet // Xóa luôn object DTO nếu có
        break

      case 'FIXED':
        if (!createDto.fixedPrice) {
          throw new BadRequestException(
            'Phải cung cấp "fixedPrice" cho cơ sở FIXED.',
          )
        }
        delete policyPayload.pricePerHour
        delete policyPayload.packageRateId
        delete policyPayload.packageRate
        delete policyPayload.tieredRateSetId
        delete policyPayload.tieredRateSet
        break

      case 'PACKAGE':
        delete policyPayload.pricePerHour
        delete policyPayload.fixedPrice
        delete policyPayload.tieredRateSetId
        delete policyPayload.tieredRateSet
        break

      case 'TIERED':
        delete policyPayload.pricePerHour
        delete policyPayload.fixedPrice
        delete policyPayload.packageRateId
        delete policyPayload.packageRate
        break
    }

    // 3. Xử lý Session
    const session = externalSession ?? (await this.connection.startSession())
    if (!externalSession) {
      session.startTransaction()
    }

    try {
      // 4. Xử lý Tiered Rate Set (Nếu có trong DTO đầu vào)
      if (basis.basisName === 'TIERED') {
        const createdTieredSet = await this.tieredRateSetService.createSet(
          createDto.tieredRateSet,
          userId,
          session,
        )
        // ✅ CẬP NHẬT: Gán ID mới tạo vào payload
        policyPayload.tieredRateSetId = createdTieredSet._id
        // 🗑️ XÓA: Xóa object DTO để không lưu nhầm vào DB (nếu Schema không định nghĩa thì Mongoose sẽ bỏ qua, nhưng xóa cho sạch)
        delete policyPayload.tieredRateSet
      }

      // 5. Xử lý Package Rate (Nếu có trong DTO đầu vào)
      if (basis.basisName === 'PACKAGE') {
        const createdPackage = await this.packageRateService.createPackageRate(
          createDto.packageRate,
          userId,
          session,
        )
        // ✅ CẬP NHẬT: Gán ID mới tạo vào payload
        policyPayload.packageRateId = createdPackage._id
        // 🗑️ XÓA: Xóa object DTO
        delete policyPayload.packageRate
      }

      // 6. Tạo Policy với dữ liệu đã được xử lý (policyPayload)
      const newPolicy = await this.pricingPolicyRepository.createPolicy(
        policyPayload as Partial<PricingPolicy>, // <--- SỬ DỤNG BIẾN ĐÃ ĐƯỢC CẬP NHẬT ID VÀ DỌN DẸP
        userId,
        session,
      )

      if (!newPolicy) {
        throw new InternalServerErrorException(
          'Không thể tạo chính sách giá mới.',
        )
      }

      if (!externalSession) {
        await session.commitTransaction()
      }

      return this.returnToPricingPolicyResponseDto(newPolicy)
    } catch (error) {
      if (!externalSession) {
        await session.abortTransaction()
      }

      // Log error để debug tốt hơn
      console.error('Error creating policy:', error)

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error
      }
      if (error.code === 11000) {
        throw new BadRequestException('Chính sách giá với tên này đã tồn tại.')
      }
      throw new InternalServerErrorException(
        `Lỗi khi tạo chính sách giá: ${error.message}`,
      )
    } finally {
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
