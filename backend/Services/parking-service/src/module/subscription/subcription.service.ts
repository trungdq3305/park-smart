/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
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
import {
  NotificationRole,
  NotificationType,
} from 'src/common/constants/notification.constant'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'
import { INotificationService } from 'src/module/notification/interfaces/inotification.service' // Thêm dòng này
import { formatDateToLocalYYYYMMDD } from 'src/utils/formatDateTime.util'

import { IAccountServiceClient } from '../client/interfaces/iaccount-service-client'
import { IParkingLotRepository } from '../parkingLot/interfaces/iparkinglot.repository'
import { IParkingLotService } from '../parkingLot/interfaces/iparkingLot.service'
import { IPricingPolicyRepository } from '../pricingPolicy/interfaces/ipricingPolicy.repository'
// Import các DTOs liên quan đến Subscription
import {
  AvailabilitySlotDto,
  CreateSubscriptionDto,
  SubscriptionCancellationPreviewResponseDto,
  SubscriptionDetailResponseDto,
  SubscriptionLogDto,
  SubscriptionRenewalEligibilityResponseDto,
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
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
    @Inject(IParkingLotService)
    private readonly parkingLotService: IParkingLotService,
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

  private calculateRefundPolicy(subscription: SubscriptionDetailResponseDto): {
    amount: number
    percent: number
    policy: string
  } {
    const now = new Date()
    const start = new Date(subscription.startDate)
    const diffTime = start.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 7) {
      return {
        amount: subscription.amountPaid,
        percent: 100,
        policy: '> 7 Days',
      }
    } else if (diffDays >= 3) {
      return {
        amount: subscription.amountPaid * 0.5,
        percent: 50,
        policy: '3-7 Days',
      }
    } else {
      return { amount: 0, percent: 0, policy: '< 3 Days' }
    }
  }

  // --- API 1: PREVIEW ---
  async getCancellationPreview(
    id: IdDto,
    userId: string,
  ): Promise<SubscriptionCancellationPreviewResponseDto> {
    const sub = await this.findSubscriptionById(id, userId)

    // Nếu đã Active -> Không cho hủy
    if (sub.status === SubscriptionStatusEnum.ACTIVE) {
      return {
        canCancel: false,
        refundAmount: 0,
        refundPercentage: 0,
        daysUntilActivation: 0,
        policyApplied: 'Active',
        warningMessage: 'Vé tháng đang hoạt động, không thể hủy.',
      }
    }

    const policy = this.calculateRefundPolicy(sub)

    return {
      canCancel: true,
      refundAmount: policy.amount,
      refundPercentage: policy.percent,
      policyApplied: policy.policy,
      daysUntilActivation: Math.ceil(
        (new Date(sub.startDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      warningMessage:
        policy.percent < 100
          ? `Bạn sẽ bị trừ phí vì hủy sát ngày. Số tiền hoàn lại: ${policy.amount.toLocaleString()}đ`
          : 'Bạn sẽ được hoàn tiền 100%.',
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateSubscriptionStatus(): Promise<void> {
    this.logger.log('[CronJob] Bắt đầu kích hoạt vé tháng SCHEDULED...')

    // 1. Gọi Repository (Lấy về map thống kê)
    const { modifiedCount, statsByParkingLot } =
      await this.subscriptionRepository.setScheduledToActiveSubscriptions()

    if (modifiedCount > 0) {
      this.logger.log(
        `[CronJob] Đã kích hoạt ${modifiedCount} vé. Tại ${statsByParkingLot.length} bãi đỗ xe.`,
      )
    } else {
      this.logger.log('[CronJob] Không có vé nào cần kích hoạt.')
    }
  }

  /**
   * ⭐️ HÀM CRON JOB ĐÃ SỬA
   * Chạy mỗi 5 phút (hoặc 10 phút) để tìm và hủy các
   * gói "chờ thanh toán" (PENDING_PAYMENT) đã quá 10 phút.
   */
  @Cron('*/3 * * * *') // Chạy mỗi 3 phút
  async handlePendingSubscriptionsTimeout(): Promise<void> {
    this.logger.log(
      '[CronJob] Bắt đầu dọn dẹp các gói PENDING_PAYMENT quá hạn...',
    )

    // 1. Tính thời gian "cắt" (10 phút trước)
    const TEN_MINUTES_AGO_MS = 10 * 60 * 1000
    const cutoffTime = new Date(Date.now() - TEN_MINUTES_AGO_MS)

    try {
      // 2. Gọi hàm Repository (đã sửa)
      const result =
        await this.subscriptionRepository.updateExpiredPendingSubscriptions(
          cutoffTime,
        )

      if (result.modifiedCount > 0) {
        this.logger.log(
          `[CronJob] Đã hủy ${String(result.modifiedCount)} gói thuê bao quá hạn.`,
        )
      } else {
        this.logger.log(
          '[CronJob] Không có gói thuê bao PENDING_PAYMENT nào quá hạn để hủy.',
        )
      }
    } catch (error) {
      this.logger.error(
        `[CronJob] Gặp lỗi khi dọn dẹp gói thuê bao: ${error.message}`,
        error.stack,
      )
    }
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
      if (!checkPaymentStatus.isValid) {
        throw new ConflictException(
          'Thanh toán không hợp lệ hoặc sai thông tin.',
        )
      }

      const amountPaid = checkPaymentStatus.amount

      // --- BƯỚC 3: HÀNH ĐỘNG (ACT) ---

      // ⭐️ Sửa Lỗi 2: Tính toán và chuẩn bị dữ liệu cập nhật
      let status: SubscriptionStatusEnum
      if (
        subscriptionDraft.startDate > new Date() // Ngày bắt đầu trong tương lai
      ) {
        status = SubscriptionStatusEnum.SCHEDULED // Đặt trạng thái thành SCHEDULED
      } else {
        status = SubscriptionStatusEnum.ACTIVE // Kích hoạt gói
      }
      const updateData = {
        amountPaid: amountPaid, // Gán số tiền đã thanh toán
        status: status, // Kích hoạt gói
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
          amountPaid: amountPaid,
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
    const pendingCount =
      await this.subscriptionRepository.countPendingByUser(userId)

    if (pendingCount >= 1) {
      // Giới hạn chỉ cho phép 1 đơn chờ
      throw new ConflictException(
        'Bạn đang có một giao dịch chưa thanh toán. Vui lòng hoàn tất hoặc hủy nó trước khi mua gói mới.',
      )
    }

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

  async cancelSubscription(
    id: IdDto,
    userId: string,
    userToken: string,
  ): Promise<boolean> {
    // 1. Lấy thông tin gói
    const subscription = await this.subscriptionRepository.findSubscriptionById(
      id.id,
      userId,
    )

    if (!subscription) {
      throw new NotFoundException('Không tìm thấy gói thuê bao.')
    }

    // 2. KIỂM TRA TRẠNG THÁI (Chỉ cho hủy khi SCHEDULED)
    // Nếu đã ACTIVE (đang chạy) hoặc EXPIRED/CANCELLED thì chặn ngay
    if (subscription.status !== SubscriptionStatusEnum.SCHEDULED) {
      throw new BadRequestException(
        'Chỉ có thể hủy gói thuê bao khi đang ở trạng thái chờ kích hoạt (Scheduled).',
      )
    }

    // 3. KIỂM TRA ĐANG SỬ DỤNG (An toàn)
    if (subscription.isUsed) {
      throw new ConflictException('Gói đang được sử dụng, không thể hủy.')
    }

    // 4. TÍNH TOÁN SỐ TIỀN HOÀN (TIERED REFUND POLICY)
    const now = new Date()
    const startDate = new Date(subscription.startDate)

    // Tính khoảng cách thời gian (miliseconds)
    const diffTime = startDate.getTime() - now.getTime()
    // Đổi sang ngày (Làm tròn lên: ví dụ còn 2.5 ngày -> tính là 3 ngày)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let refundAmount = 0
    let refundPercentage = 0

    // Áp dụng quy tắc BR-45
    if (diffDays > 7) {
      // Hủy trước hơn 7 ngày -> Hoàn 100%
      refundAmount = subscription.amountPaid
      refundPercentage = 100
    } else if (diffDays >= 3) {
      // Hủy trước 3-7 ngày -> Hoàn 50%
      refundAmount = subscription.amountPaid * 0.5
      refundPercentage = 50
    } else {
      // Hủy sát nút (< 3 ngày) -> Không hoàn tiền
      refundAmount = 0
      refundPercentage = 0
    }

    // 5. THỰC HIỆN TRANSACTION
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      // 5a. Cập nhật trạng thái trong DB -> CANCELLED
      // (Lưu ý: Bạn nên sửa hàm repo để nhận thêm refundAmount lưu vào lịch sử nếu cần)
      const cancelResult = await this.subscriptionRepository.cancelSubscription(
        id.id,
        userId,
        session,
      )

      if (!cancelResult) {
        throw new InternalServerErrorException('Hủy gói thuê bao thất bại.')
      }

      const parkingLotOperatorId =
        await this.parkingLotRepository.getParkingLotOperatorId(
          subscription.parkingLotId,
          session,
        )

      if (!parkingLotOperatorId) {
        throw new InternalServerErrorException(
          'Không tìm thấy thông tin quản lý bãi đỗ xe.',
        )
      }

      await this.subscriptionLogRepository.createLog(
        {
          paymentId: subscription.paymentId || '',
          subscriptionId: subscription._id,
          extendedUntil: subscription.endDate,
          transactionType: SubscriptionTransactionType.CANCELLATION,
          amountPaid: -refundAmount, // Số tiền hoàn (âm)
        },
        session,
      )

      // 5b. GỌI MODULE THANH TOÁN ĐỂ HOÀN TIỀN (Nếu số tiền > 0)
      if (refundAmount > 0 && subscription.paymentId) {
        // Gọi sang AccountService hoặc PaymentService
        await this.accountServiceClient.refundTransaction(
          subscription.paymentId,
          refundAmount,
          `Hoàn tiền hủy vé tháng (Trước ${diffDays} ngày - ${refundPercentage}%)`,
          userToken,
          parkingLotOperatorId,
        )

        await this.subscriptionLogRepository.createLog(
          {
            paymentId: subscription.paymentId || '',
            subscriptionId: subscription._id,
            extendedUntil: subscription.endDate,
            transactionType: SubscriptionTransactionType.REFUND,
            amountPaid: -refundAmount, // Số tiền hoàn (âm)
          },
          session,
        )
      }

      await session.commitTransaction()
      return true
    } catch (error) {
      await session.abortTransaction()
      // Log lỗi chi tiết nếu cần
      this.logger.error(`Lỗi khi hủy vé tháng: ${error.message}`)
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
    if (!checkPaymentStatus.isValid) {
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
      this.logger.log('[CronJob] Bắt đầu quét các gói thuê bao hết hạn...')

      // 1. Gọi Repository (Lấy về map thống kê)
      const { modifiedCount, statsByParkingLot } =
        await this.subscriptionRepository.setExpiredSubscriptionsJob()

      if (modifiedCount > 0) {
        this.logger.log(
          `[CronJob] Đã chuyển trạng thái EXPIRED cho ${modifiedCount} gói. Tại ${statsByParkingLot.length} bãi đỗ xe.`,
        )

        // 2. Duyệt qua từng bãi xe để CỘNG SLOT (Trả lại chỗ trống)
      } else {
        this.logger.log('[CronJob] Không có gói thuê bao nào hết hạn hôm nay.')
      }
    } catch (error) {
      this.logger.error(
        `[CronJob] Gặp lỗi khi cập nhật gói hết hạn: ${error.message}`,
        error.stack,
      )
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Chạy mỗi ngày vào lúc 00:00:00
  async sendExpiringSubscriptionNotificationsJob(): Promise<void> {
    this.logger.log('[CronJob] Bắt đầu quét gói thuê bao sắp hết hạn...')

    try {
      const DAYS_REMAINING = 3
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Chuẩn hóa về 0h

      const expiringSubscriptions =
        await this.subscriptionRepository.findExpiringSubscriptions(
          DAYS_REMAINING,
          today,
        )

      this.logger.log(
        `[CronJob] Tìm thấy ${expiringSubscriptions.length} gói sắp hết hạn.`,
      )

      for (const sub of expiringSubscriptions) {
        const expiryDate = sub.endDate.toLocaleDateString('vi-VN') // Định dạng ngày cho dễ đọc

        // Gửi thông báo
        await this.notificationService.createAndSendNotification({
          recipientId: sub.createdBy!, // ID người dùng
          recipientRole: NotificationRole.DRIVER, // Giả định người mua là DRIVER

          type: NotificationType.SUBSCRIPTION_ALERT, // Cần định nghĩa thêm loại này
          title: 'Gói Thuê Bao Sắp Hết Hạn! 🔔',
          body: `Gói thuê bao của bạn (ID: ${sub._id.slice(-4)}) sẽ hết hạn vào ngày ${expiryDate}. Vui lòng gia hạn để tiếp tục sử dụng.`,
          data: {
            subscriptionId: sub._id,
            expiryDate: sub.endDate.toISOString(),
          },
        })
      }

      this.logger.log(
        '[CronJob] Hoàn thành gửi thông báo gói thuê bao sắp hết hạn.',
      )
    } catch (error) {
      this.logger.error(
        `[CronJob Error] Lỗi khi gửi thông báo hết hạn: ${error.message}`,
        error.stack,
      )
    }
  }

  async checkRenewalEligibility(
    id: string,
    userId: string,
  ): Promise<SubscriptionRenewalEligibilityResponseDto> {
    // 1. Tìm subscription
    const subscription = await this.subscriptionRepository.findSubscriptionById(
      id,
      userId,
    )

    if (!subscription) {
      throw new NotFoundException('Không tìm thấy gói thuê bao.')
    }

    if (
      subscription.status === SubscriptionStatusEnum.CANCELLED ||
      subscription.status ===
        SubscriptionStatusEnum.CANCELLED_DUE_TO_NON_PAYMENT
    ) {
      throw new BadRequestException(
        'Gói thuê bao này đã bị hủy hoặc không thanh toán. Không thể gia hạn.',
      )
    }

    // --- THAY ĐỔI TỪ ĐÂY ---

    // 2. Xác định thời điểm cần kiểm tra Slot (Critical Time)
    let dateToCheck: Date
    const now = new Date()

    // Nếu đang Active và hạn chưa hết: Ta cần kiểm tra slot cho TƯƠNG LAI (ngay sau khi hết hạn)
    if (
      subscription.status === SubscriptionStatusEnum.ACTIVE &&
      new Date(subscription.endDate) > now
    ) {
      // Logic: Bạn đang ngồi đây, nhưng 3 ngày nữa bạn hết hạn.
      // Ta cần kiểm tra xem "3 ngày nữa" bãi xe có full không?
      dateToCheck = new Date(subscription.endDate)
      // Nhích thêm 1 giây hoặc 1 phút để đảm bảo nó nhảy sang chu kỳ mới
      dateToCheck.setMinutes(dateToCheck.getMinutes() + 1)
    } else {
      // Nếu đã Expired (hoặc Active nhưng đã quá hạn): Kiểm tra ngay bây giờ
      dateToCheck = now
    }

    // 3. Lấy quy định sức chứa
    const leasedCapacityRule =
      await this.parkingLotRepository.getLeasedCapacityRule(
        subscription.parkingLotId,
      )

    // 4. Đếm số lượng xe sẽ Active tại thời điểm `dateToCheck`
    const activeCountAtCriticalTime =
      await this.subscriptionRepository.countActiveOnDateByParkingLot(
        subscription.parkingLotId,
        dateToCheck,
        id, // Vẫn loại trừ chính nó (để tránh tự mình chặn mình nếu logic query có overlap)
      )

    // 5. So sánh và Quyết định
    if (activeCountAtCriticalTime >= leasedCapacityRule) {
      // Phân biệt thông báo lỗi cho rõ ràng
      const isFutureConflict = dateToCheck > now
      const errorMessage = isFutureConflict
        ? 'Rất tiếc, vào thời điểm gói hiện tại của bạn kết thúc, bãi xe đã kín chỗ (do có người đặt trước).'
        : 'Bãi xe hiện đã hết suất thuê bao. Không thể gia hạn lại gói đã hết hạn.'

      throw new ConflictException(errorMessage)
    }

    const pricingPolicy =
      await this.pricingPolicyRepository.findPolicyByIdForCheckRenew(
        subscription.pricingPolicyId,
      )

    if (!pricingPolicy) {
      // Trường hợp 1: ID không tồn tại trong hệ thống
      throw new NotFoundException('Gói thuê bao không tồn tại.')
    }

    if (pricingPolicy.deletedAt) {
      // Kiểm tra trường deletedAt
      // Trường hợp 2: ID có tồn tại, nhưng đã bị xóa (Lỗi thời)
      throw new ConflictException( // Dùng BadRequest hoặc Conflict hợp lý hơn NotFound
        'Chính sách giá này đã ngừng hoạt động. Vui lòng đăng ký gói mới theo chính sách hiện hành.',
      )
    }

    return {
      canRenew: true,
      message: 'Đủ điều kiện gia hạn.',
    }
  }
}
