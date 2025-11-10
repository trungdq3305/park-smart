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
import { formatDateToLocalYYYYMMDD } from 'src/utils/formatDateTime.util'

import { IAccountServiceClient } from '../client/interfaces/iaccount-service-client'
import { IParkingLotRepository } from '../parkingLot/interfaces/iparkinglot.repository'
// Import các DTOs liên quan đến Subscription
import {
  AvailabilitySlotDto,
  CreateSubscriptionDto,
  SubscriptionDetailResponseDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto'
import { SubscriptionTransactionType } from './enums/subscription.enum'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { ISubscriptionService } from './interfaces/isubcription.service'
import { ISubscriptionLogRepository } from './interfaces/isubcriptionLog.repository'
import { Subscription } from './schemas/subscription.schema'
@Injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @Inject(ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(IAccountServiceClient)
    private readonly accountServiceClient: IAccountServiceClient,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject(ISubscriptionLogRepository)
    private readonly subscriptionLogRepository: ISubscriptionLogRepository,
    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,
  ) {}

  private returnToDto(
    subscription: Subscription,
  ): SubscriptionDetailResponseDto {
    return plainToInstance(SubscriptionDetailResponseDto, subscription, {
      excludeExtraneousValues: true,
    })
  }

  async getSubscriptionAvailability(
    parkingLotId: string,
  ): Promise<Record<string, AvailabilitySlotDto>> {
    // ⭐️ 2. SỬA KIỂU TRẢ VỀ

    // 1. Lấy Quy tắc (Rule)
    const lot = await this.parkingLotRepository.findParkingLotById(parkingLotId)
    if (!lot) {
      throw new NotFoundException('Bãi đỗ xe không tồn tại.')
    }
    const leasedCapacityRule = lot.leasedCapacity

    // 2. Lấy Dữ liệu (1 lần gọi DB)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeSubs =
      await this.subscriptionRepository.findActiveAndFutureSubscriptions(
        parkingLotId,
        today,
      )

    // 3. Xử lý trong bộ nhớ (In-memory)
    // ⭐️ 3. SỬA KIỂU CỦA BIẾN
    const availabilityMap: Record<string, AvailabilitySlotDto> = {}
    const MAX_LEAD_TIME_DAYS = 15

    // (Logic chuẩn hóa 'startDate' và 'endDate' của bạn đã đúng)
    const normalizedSubs = activeSubs.map((sub) => {
      const subStart = new Date(sub.startDate)
      subStart.setHours(0, 0, 0, 0)
      const subEnd = new Date(sub.endDate)
      subEnd.setHours(0, 0, 0, 0)
      return { start: subStart, end: subEnd }
    })

    // (Logic lặp 15 ngày của bạn đã đúng)
    for (let i = 0; i < MAX_LEAD_TIME_DAYS; i++) {
      const checkingDate = new Date(today.getTime())
      checkingDate.setDate(today.getDate() + i)

      let overlappingCount = 0
      for (const sub of normalizedSubs) {
        if (checkingDate >= sub.start && checkingDate <= sub.end) {
          overlappingCount++
        }
      }

      const remaining = leasedCapacityRule - overlappingCount
      const isAvailable = remaining > 0
      const dateKey = formatDateToLocalYYYYMMDD(checkingDate)

      availabilityMap[dateKey] = { remaining, isAvailable }
    }

    return availabilityMap
  }

  async createSubscription(
    createDto: CreateSubscriptionDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const leasedCapacityRule =
        await this.parkingLotRepository.getLeasedCapacityRule(
          createDto.parkingLotId,
          session,
        )

      // Bước 2: ĐẾM SỐ LƯỢNG ĐANG DÙNG
      // (Đây là hàm 'countActiveByParkingLot' trong ISubscriptionRepository)
      const currentActiveCount =
        await this.subscriptionRepository.countActiveOnDateByParkingLot(
          createDto.parkingLotId,
          new Date(createDto.startDate),
          session,
        )

      // Bước 3: So sánh
      if (currentActiveCount >= leasedCapacityRule) {
        // (Ví dụ: 15 >= 20 là SAI ➔ Cho phép tạo)
        // (Ví dụ: 20 >= 20 là ĐÚNG ➔ Ném lỗi)
        throw new ConflictException('Đã hết suất thuê bao dài hạn.')
      }
      const checkPaymentStatus =
        await this.accountServiceClient.getPaymentStatusByPaymentId(
          createDto.paymentId,
        )
      if (!checkPaymentStatus) {
        throw new ConflictException('Vé chưa được thanh toán')
      }

      const subscriptionSend = {
        ...createDto,
        endDate: new Date(createDto.startDate).setMonth(
          new Date(createDto.startDate).getMonth() + 1,
        ),
      }
      const newSubscription =
        await this.subscriptionRepository.createSubscription(
          subscriptionSend,
          userId,
          session,
        )

      if (!newSubscription) {
        throw new InternalServerErrorException('Không thể tạo gói thuê bao.')
      }

      const dataForLog = {
        paymentId: createDto.paymentId,
        subscriptionId: newSubscription._id,
        extendedUntil: newSubscription.endDate,
        transactionType: SubscriptionTransactionType.INITIAL_PURCHASE,
      }

      await this.subscriptionLogRepository.createLog(dataForLog, session)

      await session.commitTransaction()

      return this.returnToDto(newSubscription)
    } catch (error) {
      await session.abortTransaction()
      if (error.code === 11000) {
        // Dịch lỗi CSDL thành lỗi 409 (Conflict) thân thiện
        throw new ConflictException(
          'Thanh toán này đã được sử dụng cho một gói thuê bao khác.',
        )
      }
      throw error
    } finally {
      await session.endSession()
    }
  }

  async findAllByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: SubscriptionDetailResponseDto[]
    pagination: PaginationDto
  }> {
    const { page, pageSize } = paginationQuery
    const data = await this.subscriptionRepository.findAllByUserId(
      userId,
      page,
      pageSize,
    )

    if (data.data.length === 0) {
      throw new ConflictException('Người dùng chưa có gói đăng ký nào')
    }

    return {
      data: data.data.map((s) => this.returnToDto(s)),
      pagination: {
        totalItems: data.total,
        currentPage: paginationQuery.page,
        pageSize: paginationQuery.pageSize,
        totalPages: Math.ceil(data.total / paginationQuery.pageSize),
      },
    }
  }

  async findSubscriptionById(
    id: IdDto,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    const subscription = await this.subscriptionRepository.findSubscriptionById(
      id.id,
      userId,
    )
    if (!subscription) {
      throw new ConflictException('Gói đăng ký không tồn tại')
    }
    return this.returnToDto(subscription)
  }

  async findActiveSubscriptionByIdentifier(
    subscriptionIdentifier: string,
  ): Promise<SubscriptionDetailResponseDto> {
    const subscription =
      await this.subscriptionRepository.findActiveSubscriptionByIdentifier(
        subscriptionIdentifier,
      )
    if (!subscription) {
      throw new ConflictException(
        'Gói đăng ký không tồn tại hoặc không còn hiệu lực',
      )
    }
    return this.returnToDto(subscription)
  }

  cancelSubscription(id: IdDto, userId: string): Promise<boolean> {
    throw new InternalServerErrorException('Tính năng đang phát triển.')
  }

  renewSubscription(
    id: IdDto,
    paymentId: string,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new InternalServerErrorException('Tính năng đang phát triển.')
  }

  updateSubscriptionByAdmin(
    id: IdDto,
    updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new InternalServerErrorException('Tính năng đang phát triển.')
  }
}
