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
  SubscriptionLogDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto'
import {
  SubscriptionStatusEnum,
  SubscriptionTransactionType,
} from './enums/subscription.enum'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { ISubscriptionService } from './interfaces/isubcription.service'
import { ISubscriptionLogRepository } from './interfaces/isubcriptionLog.repository'
import { SubscriptionLog } from './schemas/subcriptionLog.schema'
import { Subscription } from './schemas/subscription.schema'
import { IPricingPolicyRepository } from '../pricingPolicy/interfaces/ipricingPolicy.repository'
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
    @Inject(IPricingPolicyRepository)
    private readonly pricingPolicyRepository: IPricingPolicyRepository,
  ) {}

  private readonly logger: Logger = new Logger(SubscriptionService.name)

  private returnToDto(
    subscription: Subscription,
  ): SubscriptionDetailResponseDto {
    return plainToInstance(SubscriptionDetailResponseDto, subscription, {
      excludeExtraneousValues: true,
    })
  }

  private responseLogToDto(log: SubscriptionLog): SubscriptionLogDto {
    return plainToInstance(SubscriptionLogDto, log, {
      excludeExtraneousValues: true,
    })
  }

  private async calculateEndDate(
    pricingPolicyId: string,
    startDate: Date,
  ): Promise<Date> {
    // 1. GỌI HÀM REPO (Hàm của bạn)
    // Lấy ra các quy tắc (ví dụ: { unit: 'Tháng', durationAmount: 1 })
    const rules =
      await this.pricingPolicyRepository.getUnitPackageRateByPolicyId(
        pricingPolicyId,
      )

    if (!rules) {
      throw new InternalServerErrorException(
        'Gói giá này không tồn tại hoặc đã bị xóa.',
      )
    }

    // 2. TÍNH TOÁN (Logic chúng ta đã bàn)
    const endDate = new Date(startDate.getTime()) // Tạo bản sao
    const { durationAmount, unit } = rules

    // ⭐️ LƯU Ý: Đảm bảo 'unit' ở đây khớp với giá trị trong CSDL
    // (Ví dụ: 'MONTH' hoặc 'Tháng' tùy bạn lưu)
    switch (unit) {
      case 'DAY': // Hoặc 'Ngày'
        endDate.setDate(endDate.getDate() + durationAmount)
        break

      case 'WEEK': // Hoặc 'Tuần'
        endDate.setDate(endDate.getDate() + durationAmount * 7)
        break

      case 'MONTH': // Hoặc 'Tháng'
        endDate.setMonth(endDate.getMonth() + durationAmount)
        break

      default:
        throw new InternalServerErrorException(
          `Đơn vị thời gian không hợp lệ: ${unit}`,
        )
    }

    return endDate
  }

  updateSubscriptionStatusJob(): Promise<{
    modifiedCount: number
    failedCount: number
  }> {
    throw new Error('Method not implemented.')
  }

  async updateSubscriptionPaymentId(
    subscriptionId: string, // ID của Hóa đơn (Subscription) đang PENDING
    userId: string,
    paymentId: string, // Bằng chứng thanh toán MỚI từ .NET
  ): Promise<SubscriptionDetailResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      // --- BƯỚC 1: LẤY HÓA ĐƠN VÀ QUY TẮC ---
      // (Lấy bản ghi Subscription và populate 'pricingPolicyId' để biết giá)
      const subscriptionDraft =
        await this.subscriptionRepository.findSubscriptionById(
          subscriptionId,
          userId,
          session, // ⭐️ Khóa bản ghi
        )

      if (!subscriptionDraft) {
        throw new NotFoundException(
          'Không tìm thấy hóa đơn (subscription) này.',
        )
      }

      if (subscriptionDraft.status !== SubscriptionStatusEnum.PENDING_PAYMENT) {
        throw new ConflictException(
          'Gói thuê bao này đã được kích hoạt hoặc đã bị hủy.',
        )
      }

      // --- BƯỚC 2: KIỂM TRA (CHECKS) ---

      // ⭐️ Sửa Lỗi 1: Kiểm tra log TRƯỚC
      const existLog = await this.subscriptionLogRepository.findLogByPaymentId(
        paymentId,
        session,
      )
      if (existLog) {
        throw new ConflictException('Thanh toán này đã được sử dụng (log).')
      }

      // ⭐️ Sửa Lỗi 3: Gọi xác thực với tham số ĐÚNG
      const checkPaymentStatus =
        await this.accountServiceClient.getPaymentStatusByPaymentId(
          paymentId,
          userId,
          'PAID', // ⭐️ Trạng thái mong đợi từ .NET
        )
      if (!checkPaymentStatus) {
        throw new ConflictException(
          'Thanh toán không hợp lệ hoặc sai thông tin.',
        )
      }

      // --- BƯỚC 3: HÀNH ĐỘNG (ACT) ---

      // ⭐️ Sửa Lỗi 2: Tính toán và chuẩn bị dữ liệu cập nhật
      const updateData = {
        status: SubscriptionStatusEnum.ACTIVE, // Kích hoạt gói
        paymentId: paymentId, // Gán paymentId (gốc)
        endDate: await this.calculateEndDate(
          subscriptionDraft.pricingPolicyId,
          subscriptionDraft.startDate,
        ), // (Gói PENDING đã có endDate)
        // (Bạn có thể tính lại endDate ở đây nếu logic yêu cầu)
      }

      const updatedSubscription =
        await this.subscriptionRepository.updateSubscription(
          subscriptionId,
          updateData,
          session,
        )

      if (!updatedSubscription) {
        throw new InternalServerErrorException(
          'Cập nhật gói thuê bao thất bại.',
        )
      }

      // (Logic đếm log của bạn đã đúng, nhưng có thể bị Race Condition)
      // Cách an toàn hơn là kiểm tra xem 'paymentId' (gốc) của 'updatedSubscription'
      // có phải là null hay không.
      const isInitialPurchase = !subscriptionDraft.paymentId // (Kiểm tra xem đây có phải lần gán đầu tiên không)

      // Ghi log
      await this.subscriptionLogRepository.createLog(
        {
          paymentId: paymentId,
          subscriptionId: subscriptionId,
          extendedUntil: updatedSubscription.endDate,
          transactionType: isInitialPurchase
            ? SubscriptionTransactionType.INITIAL_PURCHASE
            : SubscriptionTransactionType.RENEWAL,
        },
        session,
      )

      await session.commitTransaction()

      // Trả về DTO
      return this.returnToDto(updatedSubscription)
    } catch (error) {
      await session.abortTransaction()

      // ⭐️ Sửa Lỗi 4: Bắt lỗi 11000
      if (error.code === 11000) {
        throw new ConflictException(
          'Thanh toán này đã được sử dụng (Lỗi 11000).',
        )
      }
      // Ném lại các lỗi khác
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error
      }
      throw new InternalServerErrorException(error.message)
    } finally {
      await session.endSession()
    }
  }

  async findLogsBySubscriptionId(
    subscriptionId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: SubscriptionLogDto[]; pagination: PaginationDto }> {
    const { page, pageSize } = paginationQuery
    const data = await this.subscriptionLogRepository.findLogsBySubscriptionId(
      subscriptionId,
      page,
      pageSize,
    )
    return {
      data: data.data.map((log) => this.responseLogToDto(log)),
      pagination: {
        totalItems: data.total,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(data.total / pageSize),
      },
    }
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
          undefined,
          session,
        )

      // Bước 3: So sánh
      if (currentActiveCount >= leasedCapacityRule) {
        // (Ví dụ: 15 >= 20 là SAI ➔ Cho phép tạo)
        // (Ví dụ: 20 >= 20 là ĐÚNG ➔ Ném lỗi)
        throw new ConflictException('Đã hết suất thuê bao dài hạn.')
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
    // (Phần này của bạn đã đúng: check NotFound, CANCELLED, Payment, Log)
    const existingSubscription =
      await this.subscriptionRepository.findSubscriptionById(id.id, userId)
    if (!existingSubscription) {
      throw new NotFoundException('Không tìm thấy gói thuê bao.')
    }
    if (existingSubscription.status === SubscriptionStatusEnum.CANCELLED) {
      throw new BadRequestException(
        'Gói thuê bao này đã bị hủy. Không thể gia hạn.',
      )
    }
    const checkPaymentStatus =
      await this.accountServiceClient.getPaymentStatusByPaymentId(
        paymentId,
        userId,
        'PAID',
      )
    if (!checkPaymentStatus) {
      throw new ConflictException('Vé chưa được thanh toán')
    }
    const checkLog =
      await this.subscriptionLogRepository.findLogByPaymentId(paymentId)
    if (checkLog) {
      throw new ConflictException('Thanh toán đã được sử dụng')
    }

    // --- Biến tạm cho BƯỚC 2 và 3 ---
    let newStartDate: Date
    let newEndDate: Date
    let dateToCheckForAvailability: Date // ⭐️ Ngày dùng để kiểm tra slot

    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      // --- BƯỚC 2: TÍNH TOÁN (Xác định ngày tháng) ---
      const now = new Date()
      const oldEndDate = new Date(existingSubscription.endDate)

      if (
        existingSubscription.status === SubscriptionStatusEnum.ACTIVE &&
        oldEndDate >= now
      ) {
        // KỊCH BẢN 1: Vẫn còn hạn (Cộng dồn)
        newStartDate = existingSubscription.startDate
        newEndDate = await this.calculateEndDate(
          existingSubscription.pricingPolicyId,
          oldEndDate,
        ) // ⭐️ Sửa 1: Dùng await

        // Ngày kiểm tra slot: Là ngày đầu tiên của chu kỳ MỚI
        dateToCheckForAvailability = new Date(oldEndDate)
        dateToCheckForAvailability.setDate(oldEndDate.getDate() + 1)
      } else {
        // KỊCH BẢN 2: Đã hết hạn
        newStartDate = now // Bắt đầu từ hôm nay
        newEndDate = await this.calculateEndDate(
          existingSubscription.pricingPolicyId,
          now,
        ) // ⬅️ Sửa ở đây

        // Ngày kiểm tra slot: Là ngày HÔM NAY
        dateToCheckForAvailability = now
      }

      // --- BƯỚC 3: KIỂM TRA SỨC CHỨA (ĐÃ DI CHUYỂN RA NGOÀI IF/ELSE) ---
      const leasedCapacityRule =
        await this.parkingLotRepository.getLeasedCapacityRule(
          existingSubscription.parkingLotId,
          session,
        )

      const currentActiveCount =
        await this.subscriptionRepository.countActiveOnDateByParkingLot(
          existingSubscription.parkingLotId,
          dateToCheckForAvailability, // ⭐️ SỬA 1: Dùng ngày kiểm tra ĐÚNG
          id.id, // ⭐️ SỬA 2: Loại trừ chính nó
          session,
        )

      if (currentActiveCount >= leasedCapacityRule) {
        throw new ConflictException(
          `Đã hết suất thuê bao dài hạn cho bãi đỗ xe này.`,
        )
      }

      // --- BƯỚC 4: CẬP NHẬT CSDL (CHẠY 1 LẦN) ---
      const dataSend = {
        startDate: newStartDate,
        endDate: newEndDate,
        status: SubscriptionStatusEnum.ACTIVE, // Luôn kích hoạt lại
      }

      const updatedSubscription =
        await this.subscriptionRepository.updateSubscription(
          id.id,
          dataSend,
          session,
        )

      if (!updatedSubscription) {
        throw new InternalServerErrorException('Gia hạn gói thuê bao thất bại.')
      }

      // Ghi log
      const logData = {
        paymentId,
        subscriptionId: existingSubscription._id,
        extendedUntil: newEndDate,
        transactionType: SubscriptionTransactionType.RENEWAL,
      }
      await this.subscriptionLogRepository.createLog(logData, session)

      // Commit
      await session.commitTransaction()

      // (Lấy updatedSubscription đã populate để trả về)
      const populatedSub =
        await this.subscriptionRepository.findSubscriptionById(id.id, userId)
      if (!populatedSub) {
        throw new InternalServerErrorException(
          'Không thể lấy dữ liệu sau khi gia hạn.',
        )
      }
      return this.returnToDto(populatedSub)
    } catch (error) {
      await session.abortTransaction()
      if (error.code === 11000) {
        throw new ConflictException(
          'Thanh toán này đã được sử dụng cho một gói thuê bao khác.',
        )
      }
      throw error
    } finally {
      await session.endSession()
    }
  }

  updateSubscriptionByAdmin(
    _id: IdDto,
    _updateDto: UpdateSubscriptionDto,
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
