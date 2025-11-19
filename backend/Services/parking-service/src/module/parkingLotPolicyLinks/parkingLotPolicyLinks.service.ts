import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Cron, CronExpression } from '@nestjs/schedule'
import { plainToInstance } from 'class-transformer'
import { Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { IParkingLotRepository } from '../parkingLot/interfaces/iparkinglot.repository'
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
    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,
    @Inject(IPricingPolicyService)
    private readonly pricingPolicyService: IPricingPolicyService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private readonly logger = new Logger(ParkingLotPolicyLinksService.name)

  async updateEndDate(
    linkId: string,
    endDate: string,
    userId: string,
  ): Promise<boolean> {
    if (new Date(endDate) <= new Date()) {
      throw new BadRequestException(
        'Ngày kết thúc theo lịch phải ở tương lai. Nếu muốn xóa ngay hãy dùng API Delete.',
      )
    }

    const existingLink =
      await this.parkingLotPolicyLinksRepository.findLinkById(linkId)

    if (!existingLink) {
      throw new NotFoundException('Không tìm thấy liên kết chính sách bãi xe.')
    }

    const newEndDate = new Date(endDate)
    newEndDate.setHours(0, 0, 0, 0)

    if (existingLink.startDate >= newEndDate) {
      throw new BadRequestException(
        'Ngày kết thúc phải sau ngày bắt đầu của liên kết.',
      )
    }

    const updated = await this.parkingLotPolicyLinksRepository.updateEndDate(
      linkId,
      newEndDate,
      userId,
    )
    if (!updated) throw new NotFoundException('Không tìm thấy liên kết.')

    return true
  }

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
      }

      await this.checkExist(createDto.parkingLotId)
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredLinks(): Promise<void> {
    this.logger.log(
      '🕒 Bắt đầu xử lý các liên kết chính sách bãi xe hết hạn...',
    )

    try {
      const now = new Date()
      // 1. Lấy danh sách (Giả sử hàm này trả về mảng các Document đầy đủ)
      const expiredLinks =
        await this.parkingLotPolicyLinksRepository.findExpiredActiveLinks(now)

      if (!expiredLinks.length) {
        // this.logger.log('✅ Không có liên kết nào cần xóa.')
        return
      }

      this.logger.log(
        `🔎 Tìm thấy ${String(expiredLinks.length)} liên kết cần xử lý.`,
      )

      // 2. Duyệt từng phần tử
      for (const link of expiredLinks) {
        const session = await this.connection.startSession()
        session.startTransaction()

        try {
          // --- BẮT ĐẦU LOGIC ---

          // Kiểm tra xem link có pricingPolicyId không (tránh lỗi null/undefined)
          if (link.pricingPolicyId) {
            // Gọi hàm xóa cascade (Policy -> RateSets -> Policy)
            // Lưu ý: Đảm bảo link.pricingPolicyId là string hoặc ObjectId string
            await this.pricingPolicyService.softDeletePolicyWithCascade(
              link.pricingPolicyId,
              'SYSTEM_CRON',
              session,
            )
          }

          // Xóa Link
          const deleteResult =
            await this.parkingLotPolicyLinksRepository.softDeleteLink(
              link._id,
              'SYSTEM_CRON',
              session,
            )

          if (!deleteResult) {
            // Ném lỗi để nhảy xuống catch, rollback transaction này
            throw new Error('Repository trả về false khi xóa link')
          }

          await session.commitTransaction()
          this.logger.log(`✅ [SUCCESS] Đã xóa Link ID: ${link._id}`)

          // --- KẾT THÚC LOGIC ---
        } catch (error) {
          // 3. QUAN TRỌNG: Xử lý lỗi cục bộ cho từng Link
          await session.abortTransaction()

          this.logger.error(
            `❌ [FAILED] Lỗi khi xóa Link ID: ${link._id}. Tiếp tục sang link khác...`,
            error.stack,
          )
          // KHÔNG throw error ở đây để vòng lặp for vẫn chạy tiếp các link sau
        } finally {
          await session.endSession()
        }
      }
    } catch (error) {
      // Đây là lỗi toàn cục (ví dụ: mất kết nối DB ngay từ đầu, lỗi code logic dòng 1...)
      this.logger.error(
        '🔥 Lỗi nghiêm trọng khi chạy Cron Job handleExpiredLinks:',
        error,
      )
    }
  }
}
