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
import {
  SubscriptionStatusEnum,
  SubscriptionTransactionType,
} from './enums/subscription.enum'
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

  private readonly logger: Logger = new Logger(SubscriptionService.name)

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

  async cancelSubscription(id: IdDto, userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findSubscriptionById(
      id.id,
      userId,
    )

    if (!subscription) {
      throw new NotFoundException('Không tìm thấy gói thuê bao.')
    }

    const now = new Date()
    const minCancellationDate = new Date()
    minCancellationDate.setDate(now.getDate() + 5) // Đặt ngày giới hạn là 5 ngày tới

    const subscriptionStartDate = new Date(subscription.startDate) // Ngày bắt đầu của gói

    // 3. SO SÁNH
    // Nếu ngày bắt đầu của gói <= ngày giới hạn (tức là nằm TRONG VÒNG 5 ngày tới)
    if (subscriptionStartDate <= minCancellationDate) {
      throw new BadRequestException(
        'Không thể hủy gói thuê bao trong vòng 5 ngày trước ngày bắt đầu.',
      )
    }

    // 4. KIỂM TRA CÁC LOGIC KHÁC
    // (Ví dụ: không cho hủy nếu đang có xe trong bãi)
    if (subscription.isUsed) {
      throw new ConflictException('Gói đang được sử dụng, không thể hủy.')
    }
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const cancelResult = await this.subscriptionRepository.cancelSubscription(
        id.id,
        userId,
        session,
      )

      if (!cancelResult) {
        throw new InternalServerErrorException('Hủy gói thuê bao thất bại.')
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

  async renewSubscription(
    id: IdDto,
    paymentId: string,
    userId: string,
  ): Promise<SubscriptionDetailResponseDto> {
    // --- BƯỚC 1: LẤY VÀ KIỂM TRA (GUARD CLAUSES) ---

    const existingSubscription =
      await this.subscriptionRepository.findSubscriptionById(id.id, userId)

    if (!existingSubscription) {
      throw new NotFoundException('Không tìm thấy gói thuê bao.')
    }

    // ⭐️⭐️ SỬA LỖI 1: CHẶN GÓI ĐÃ HỦY (THEO YÊU CẦU CỦA BẠN) ⭐️⭐️
    if (existingSubscription.status === SubscriptionStatusEnum.CANCELLED) {
      throw new BadRequestException(
        'Gói thuê bao này đã bị hủy. Không thể gia hạn.',
      )
    }

    // (⭐️ BẠN VẪN ĐANG THIẾU BƯỚC KIỂM TRA THANH TOÁN MỚI ⭐️)
    const checkPaymentStatus =
      await this.accountServiceClient.getPaymentStatusByPaymentId(paymentId)
    if (!checkPaymentStatus) {
      throw new ConflictException('Vé chưa được thanh toán')
    }
    const checkLog =
      await this.subscriptionLogRepository.findLogByPaymentId(paymentId)
    if (checkLog) {
      throw new ConflictException('Thanh toán đã được sử dụng')
    }

    const session = await this.connection.startSession()
    session.startTransaction()

    let newStartDate: Date
    let newEndDate: Date
    let updatedSubscription: Subscription | null // Biến tạm để lưu kết quả update

    try {
      // --- BƯỚC 2: TÍNH TOÁN (LOGIC IF/ELSE ĐÃ SỬA) ---

      const now = new Date()
      const oldEndDate = new Date(existingSubscription.endDate)

      // (Giả sử bạn lấy 'packageDuration' (vd: 1 tháng) từ policy)
      const packageDuration = 1 // (TODO: Lấy từ pricingPolicyId)

      // ⭐️⭐️ SỬA LỖI 2&3: GỘP LOGIC 'ACTIVE' VÀ 'EXPIRED' ⭐️⭐️
      if (
        existingSubscription.status === SubscriptionStatusEnum.ACTIVE &&
        oldEndDate >= now
      ) {
        // KỊCH BẢN 1: Vẫn còn hạn (Cộng dồn)
        newStartDate = existingSubscription.startDate // Giữ nguyên ngày bắt đầu
        newEndDate = new Date(oldEndDate)
        newEndDate.setMonth(newEndDate.getMonth() + packageDuration)
      } else {
        // KỊCH BẢN 2: Đã hết hạn (hoặc 'ACTIVE' nhưng đã quá hạn)
        // Tính lại từ đầu
        newStartDate = now // Bắt đầu từ hôm nay
        newEndDate = new Date(now)
        newEndDate.setMonth(newEndDate.getMonth() + packageDuration)
      }

      // --- BƯỚC 3: CẬP NHẬT CSDL (CHẠY 1 LẦN) ---

      const dataSend = {
        startDate: newStartDate,
        endDate: newEndDate,
        status: SubscriptionStatusEnum.ACTIVE, // Luôn kích hoạt lại
      }

      updatedSubscription =
        await this.subscriptionRepository.updateSubscription(
          id.id,
          dataSend,
          session,
        )

      if (!updatedSubscription) {
        throw new InternalServerErrorException('Gia hạn gói thuê bao thất bại.')
      }

      // Ghi log (Đã đúng)
      const logData = {
        paymentId,
        subscriptionId: existingSubscription._id,
        extendedUntil: newEndDate,
        transactionType: SubscriptionTransactionType.RENEWAL,
      }
      await this.subscriptionLogRepository.createLog(logData, session)

      // ⭐️⭐️ SỬA LỖI 2&3: CHỈ COMMIT 1 LẦN ⭐️⭐️
      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction()
      if (error.code === 11000) {
        throw new ConflictException(
          'Thanh toán này đã được sử dụng cho một gói thuê bao khác.',
        )
      }
      // Ném lại các lỗi (BadRequest, NotFound, ...)
      throw error
    } finally {
      await session.endSession()
    }

    // --- BƯỚC 4: TRẢ VỀ (BÊN NGOÀI TRY/CATCH) ---
    // (Chúng ta populate lại 'updatedSubscription' để lấy DTO đầy đủ nhất)
    const populatedSub = await this.subscriptionRepository.findSubscriptionById(
      id.id,
      userId,
    )
    if (!populatedSub) {
      throw new NotFoundException('Không tìm thấy gói thuê bao.')
    }
    return this.returnToDto(populatedSub)
  }

  updateSubscriptionByAdmin(
    id: IdDto,
    updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionDetailResponseDto> {
    throw new InternalServerErrorException('Tính năng đang phát triển.')
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async setExpiredSubscriptionsJob(): Promise<void> {
    try {
      const result =
        await this.subscriptionRepository.setExpiredSubscriptionsJob()

      // 1. Chỉ log (info) số lượng thành công
      this.logger.log(
        `[CronJob] Đã cập nhật ${String(
          result.modifiedCount,
        )} gói thuê bao hết hạn.`,
      )

      // 2. Chỉ cảnh báo (warn) nếu có gì đó không khớp
      if (result.failedCount > 0) {
        this.logger.warn(
          `[CronJob] Có ${String(
            result.failedCount,
          )} gói được tìm thấy nhưng không cập nhật.`,
        )
      }
    } catch (error) {
      // 3. ⭐️ Đây mới là nơi bắt lỗi thực sự (ví dụ: CSDL sập)
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `[CronJob] Gặp lỗi khi cập nhật gói hết hạn: ${error.message}`,
        error.stack,
      )
    }
  }
}
