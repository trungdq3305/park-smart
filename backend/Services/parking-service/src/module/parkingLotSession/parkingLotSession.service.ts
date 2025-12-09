/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { InjectConnection } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import * as dayjs from 'dayjs'
import { Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

import { IAccountServiceClient } from '../client/interfaces/iaccount-service-client'
import { IGuestCardService } from '../guestCard/interfaces/iguestCard.service'
import { IParkingLotRepository } from '../parkingLot/interfaces/iparkinglot.repository'
import { IParkingLotService } from '../parkingLot/interfaces/iparkingLot.service'
import { TransactionTypeEnum } from '../parkingTransaction/enum/parkingTransaction.enum'
import { IParkingTransactionRepository } from '../parkingTransaction/interfaces/iparkingTransaction.repository'
import { IPricingPolicyRepository } from '../pricingPolicy/interfaces/ipricingPolicy.repository'
import { ReservationStatusEnum } from '../reservation/enums/reservation.enum'
import { IReservationRepository } from '../reservation/interfaces/ireservation.repository'
import { ISubscriptionRepository } from '../subscription/interfaces/isubcription.repository'
import {
  CheckInDto,
  ParkingLotSessionResponseDto,
} from './dto/parkingLotSession.dto'
import {
  ParkingSessionStatusEnum,
  PaymentStatusEnum,
} from './enums/parkingLotSession.enum'
import { IParkingLotSessionRepository } from './interfaces/iparkingLotSession.repository'
import { IParkingLotSessionService } from './interfaces/iparkingLotSession.service'
import { ParkingLotSession } from './schemas/parkingLotSession.schema'

@Injectable()
export class ParkingLotSessionService implements IParkingLotSessionService {
  private readonly logger = new Logger(ParkingLotSessionService.name)

  // ⭐️ Khai báo các property để lưu instance sau này
  private subscriptionRepository: ISubscriptionRepository
  private reservationRepository: IReservationRepository

  constructor(
    @Inject(IParkingLotSessionRepository)
    private readonly parkingLotSessionRepository: IParkingLotSessionRepository,

    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,

    @Inject(IAccountServiceClient)
    private readonly accountServiceClient: IAccountServiceClient,

    @InjectConnection() private readonly connection: Connection,

    // ⭐️ Inject ModuleRef để lấy dependency thủ công
    private moduleRef: ModuleRef,

    @Inject(forwardRef(() => IParkingLotService))
    private readonly parkingLotService: IParkingLotService,

    @Inject(IGuestCardService)
    private readonly guestCardService: IGuestCardService,

    @Inject(IPricingPolicyRepository)
    private readonly pricingPolicyRepository: IPricingPolicyRepository,

    @Inject(IParkingTransactionRepository)
    private readonly parkingTransactionRepository: IParkingTransactionRepository,
  ) {}

  /**
   * ⭐️ Hàm này chạy SAU KHI tất cả các module đã khởi tạo xong.
   * Lúc này, vòng lặp dependency đã được giải quyết.
   */
  onModuleInit() {
    try {
      this.subscriptionRepository = this.moduleRef.get(
        ISubscriptionRepository,
        {
          strict: false, // Cho phép lấy từ module khác
        },
      )

      this.reservationRepository = this.moduleRef.get(IReservationRepository, {
        strict: false,
      })
    } catch (error) {
      this.logger.error('Lỗi Lazy Inject repository:', error)
    }
  }

  private responseToDto(
    session: ParkingLotSession,
  ): ParkingLotSessionResponseDto {
    return plainToInstance(ParkingLotSessionResponseDto, session, {
      excludeExtraneousValues: true,
    })
  }

  /**
   * (Hàm helper - Private)
   * Gọi sang Image-Service để tải ảnh lên.
   * Được gọi sau khi commit transaction thành công (để không chặn luồng chính).
   */
  private async uploadImageToImageService(
    file: Express.Multer.File,
    ownerId: string,
    ownerType: string,
    description?: string,
  ): Promise<any> {
    try {
      // 1. Gọi Client (Hàm này trả về { id, url } hoặc null)
      const uploadResult =
        await this.accountServiceClient.uploadImageToImageService(
          file.buffer,
          ownerType,
          ownerId,
          description ?? '',
        )

      // 2. Kiểm tra kết quả
      // Vì response body thực tế chỉ có { id, url }, không có field "status" bên trong
      // Nên ta chỉ cần check xem nó có dữ liệu hay không.
      if (!uploadResult?.url) {
        throw new Error('Service không trả về URL ảnh (Upload thất bại?)')
      }

      // 3. Trả về kết quả { id, url }
      return uploadResult
    } catch (error) {
      this.logger.error(
        `[ImageProxy] Upload ảnh thất bại cho ${ownerType} ${ownerId}: ${error.message}`,
      )
      // Trả về null để quy trình Check-in không bị chết, chỉ thiếu ảnh thôi
      return null
    }
  }

  private calculatePriceByPolicy(policy: any, durationHours: number): number {
    const basisName = policy.basisId?.basisName // Ví dụ: "PACKAGE", "HOURLY", "TIERED", "FIXED"

    switch (basisName) {
      case 'HOURLY':
        // Tính theo giờ: Số giờ * Giá mỗi giờ
        return durationHours * (policy.pricePerHour ?? 0)

      case 'FIXED':
        // Tính cố định (theo lượt): Trả về giá cố định bất kể thời gian
        return policy.fixedPrice ?? 0

      case 'PACKAGE':
        // Tính theo gói: Lấy giá từ packageRateId
        if (policy.packageRateId) {
          return policy.packageRateId.price
        }
        return 0

      case 'TIERED': // Hoặc "BLOCK"
        // Tính theo bậc thang
        if (policy.tieredRateSetId?.tiers) {
          const tiers = policy.tieredRateSetId.tiers

          // Tìm bậc giá phù hợp với durationHours
          // Logic: duration phải lớn hơn fromHour và (nhỏ hơn hoặc bằng toHour HOẶC toHour là null/vô cùng)
          const matchedTier = tiers.find((tier: any) => {
            const from = parseFloat(tier.fromHour)
            // Nếu toHour null thì coi như vô cùng
            const to = tier.toHour ? parseFloat(tier.toHour) : Infinity

            return durationHours > from && durationHours <= to
          })

          // Nếu tìm thấy bậc thì trả về giá của bậc đó
          // Nếu không tìm thấy (thường là giờ đầu tiên <= fromHour của bậc 1),
          // bạn cần logic fallback, ở đây tôi giả sử lấy bậc đầu tiên hoặc trả về 0.
          if (matchedTier) {
            return matchedTier.price
          }

          // Fallback: Nếu không khớp tier nào (ví dụ cấu hình lỗi),
          // có thể return giá của tier cao nhất hoặc ném lỗi.
          // Ở đây return tier cuối cùng nếu thời gian vượt quá mọi toHour định nghĩa
          if (tiers.length > 0) {
            return tiers[tiers.length - 1].price
          }
        }
        return 0

      default:
        // Trường hợp không xác định basis
        return 0
    }
  }

  private calculateReputationDelta(
    estimatedEndTime: Date,
    actualCheckOutTime: Date,
  ): { change: number; reason: string } {
    const end = dayjs(estimatedEndTime)
    const actual = dayjs(actualCheckOutTime)

    // Tính số phút chênh lệch (Dương = Trễ, Âm = Sớm)
    const diffMinutes = actual.diff(end, 'minute')
    const GRACE_PERIOD = 15

    // 1. ĐÚNG GIỜ HOẶC SỚM (hoặc trễ trong ân hạn) => THƯỞNG
    if (diffMinutes <= GRACE_PERIOD) {
      return { change: 1, reason: 'Checkout đúng giờ/sớm' }
    }

    // 2. TRỄ => PHẠT
    const lateMinutes = diffMinutes - GRACE_PERIOD

    if (lateMinutes <= 60) {
      return { change: -2, reason: 'Trễ dưới 1 giờ' }
    }
    if (lateMinutes <= 180) {
      // 3 tiếng
      return { change: -5, reason: 'Trễ 1-3 giờ' }
    }
    if (lateMinutes <= 1440) {
      // 24 tiếng
      return { change: -10, reason: 'Trễ quá 3 giờ' }
    }

    // Trễ quá 24h
    return { change: -50, reason: 'Trễ nghiêm trọng (>24h)' }
  }

  /**
   * Check-in Phân luồng:
   * - Ưu tiên 1: Kiểm tra QR Vé Tháng (Xô 1).
   * - Ưu tiên 2: Kiểm tra QR Đặt Trước (Xô 2).
   * - Fallback: Nếu không phải QR hợp lệ, kiểm tra xem có phải thẻ NFC Vãng lai (Xô 3) không.
   */
  async checkIn(
    parkingLotId: string,
    dto: CheckInDto,
    file: Express.Multer.File,
  ): Promise<ParkingLotSessionResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()

    let newSession: ParkingLotSession | null = null

    try {
      // 1. Validate Bãi xe
      const lot = await this.parkingLotRepository.findParkingLotById(
        parkingLotId,
        session,
      )
      if (!lot) throw new NotFoundException('Bãi đỗ xe không tồn tại.')

      // =================================================================
      // A. XỬ LÝ CHECK-IN BẰNG QR (XÔ 1 & 2 - Vé Tháng / Đặt Trước)
      // =================================================================
      // Lưu ý: Vé tháng dùng QR nên không cần tìm thẻ GuestCard (NFC)
      if (dto.identifier) {
        // A1. Kiểm tra Vé Tháng (Xô 1)
        const sub =
          await this.subscriptionRepository.findActiveSubscriptionByIdentifier(
            dto.identifier,
          )

        if (sub) {
          if (sub.parkingLotId.toString() !== parkingLotId) {
            throw new ConflictException(
              'QR Vé tháng này không thuộc bãi xe này.',
            )
          }

          if (sub.isUsed) {
            throw new ConflictException(
              'Vé tháng này đang được sử dụng (xe chưa ra).',
            )
          }

          // Cập nhật trạng thái vé tháng
          await this.subscriptionRepository.updateUsageStatus(
            sub.subscriptionIdentifier,
            true,
            session,
          )

          // Tạo Session Xô 1 (Không có guestCardId vì dùng QR)
          newSession = await this.parkingLotSessionRepository.createSession(
            {
              parkingLotId,
              plateNumber: dto.plateNumber ?? 'QR-MONTHLY',
              checkInTime: new Date(),
              status: ParkingSessionStatusEnum.ACTIVE,
              paymentStatus: PaymentStatusEnum.NOT_APPLICABLE,
              subscriptionId: sub._id,
              reservationId: undefined,
              guestCardId: undefined, // QR không liên kết thẻ vật lý
              nfcUid: dto.identifier, // Lưu mã QR vào đây để tra cứu
            },
            session,
          )
        }
        // A2. Kiểm tra Vé Đặt Trước (Xô 2)
        else {
          const res =
            await this.reservationRepository.findValidReservationForCheckIn(
              dto.identifier,
            )

          if (res) {
            if (res.parkingLotId !== parkingLotId) {
              throw new ConflictException('QR Đặt trước không đúng bãi xe.')
            }

            // Cập nhật trạng thái đặt trước
            await this.reservationRepository.updateReservationStatus(
              res._id,
              ReservationStatusEnum.CHECKED_IN,
              'SYSTEM',
              session,
            )

            // Tạo Session Xô 2
            newSession = await this.parkingLotSessionRepository.createSession(
              {
                parkingLotId,
                plateNumber: dto.plateNumber ?? 'QR-RESERVATION',
                checkInTime: new Date(),
                status: ParkingSessionStatusEnum.ACTIVE,
                paymentStatus: PaymentStatusEnum.PREPAID,
                reservationId: res._id,
                subscriptionId: undefined,
                guestCardId: undefined, // QR không liên kết thẻ vật lý
                nfcUid: dto.identifier,
              },
              session,
            )
          }
        }
      }

      // =================================================================
      // B. XỬ LÝ KHÁCH VÃNG LAI (XÔ 3 - Dùng thẻ NFC hoặc Biển số)
      // =================================================================
      // Chỉ chạy vào đây nếu chưa tạo được session ở trên
      if (!newSession) {
        let guestCardId: string | undefined = undefined

        // Kiểm tra xem mã gửi lên có phải là thẻ NFC hợp lệ trong bãi không
        if (dto.nfcUid) {
          const guestCard = await this.guestCardService.findGuestCardByNfc(
            dto.nfcUid,
            parkingLotId,
          )

          if (guestCard) {
            // ==> ĐÂY LÀ THẺ NFC VÃNG LAI HỢP LỆ
            guestCardId = guestCard._id
          }
        }

        // CHỈ tạo session nếu tìm thấy thẻ NFC (guestCardId tồn tại)
        // Nếu chỉ có biển số mà không có thẻ -> Bỏ qua (sẽ rơi xuống BadRequest ở dưới)
        if (guestCardId) {
          // B1. Kiểm tra sức chứa Xô 3
          const currentWalkIns =
            await this.parkingLotSessionRepository.countActiveWalkInSessions(
              parkingLotId,
              session,
            )

          if (currentWalkIns >= lot.walkInCapacity) {
            throw new ConflictException('Đã hết chỗ dành cho khách vãng lai.')
          }

          // B2. Tạo Session Xô 3
          newSession = await this.parkingLotSessionRepository.createSession(
            {
              parkingLotId,
              plateNumber: dto.plateNumber ?? 'UNKNOWN', // Biển số có thể chưa có lúc vào
              checkInTime: new Date(),
              status: ParkingSessionStatusEnum.ACTIVE,
              paymentStatus: PaymentStatusEnum.PENDING, // Trả sau
              reservationId: undefined,
              subscriptionId: undefined,
              guestCardId, // 👈 Bắt buộc có
              nfcUid: dto.nfcUid,
            },
            session,
          )
        }
      }

      // =================================================================
      // C. KẾT THÚC
      // =================================================================
      if (!newSession) {
        throw new BadRequestException(
          'Vui lòng cung cấp Mã QR/Thẻ hợp lệ hoặc Biển số xe để check-in.',
        )
      }

      const updateSpots =
        await this.parkingLotService.updateAvailableSpotsForWebsocket(
          parkingLotId,
          -1,
        )

      if (!updateSpots) {
        this.logger.warn(
          `Cập nhật chỗ trống qua WebSocket thất bại cho bãi xe ${parkingLotId}`,
        )
      }

      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }

    // =================================================================
    // D. TÁC VỤ NỀN (POST-COMMIT)
    // =================================================================

    // 1. Cập nhật WebSocket
    if (newSession.guestCardId) {
      const wsData =
        await this.parkingLotService.updateAvailableSpotsForWebsocket(
          parkingLotId,
          -1,
        )
      if (!wsData) {
        this.logger.warn(
          `Cập nhật chỗ trống qua WebSocket thất bại cho bãi xe ${parkingLotId} khi check-in session ${newSession._id}`,
        )
      }
    }

    // 2. Upload ảnh
    const ownerType = 'ParkingSession'
    await this.uploadImageToImageService(
      file,
      newSession._id,
      ownerType,
      dto.description ?? 'Check-in Photo',
    )

    return this.responseToDto(newSession)
  }

  async calculateCheckoutFee(
    parkingLotId: string,
    pricingPolicyId: string,
    uidCard?: string,
    identifier?: string,
  ): Promise<{
    amount: number
    sessionId: string
    message?: string
  }> {
    // 1. Lấy chính sách giá (giữ nguyên)
    const pricingPolicy =
      await this.pricingPolicyRepository.findPolicyById(pricingPolicyId)
    if (!pricingPolicy) {
      throw new NotFoundException('Chính sách giá không tồn tại.')
    }

    // 2. Kiểm tra đặt trước (Reservation) (giữ nguyên)
    if (identifier) {
      const reservation =
        await this.reservationRepository.findValidReservationForCheckIn(
          identifier,
        )

      const subscription =
        await this.subscriptionRepository.findActiveSubscriptionByIdentifier(
          identifier,
        )

      if (subscription) {
        const activeSession =
          await this.parkingLotSessionRepository.findActiveSessionBySubscriptionId(
            subscription._id.toString(),
            parkingLotId,
          )

        if (!activeSession) {
          throw new NotFoundException(
            'Phiên đỗ xe đang hoạt động không tồn tại.',
          )
        }

        // 2. So sánh ngày hết hạn
        const now = new Date()
        const endDate = new Date(subscription.endDate)

        // Case A: Chưa hết hạn (hoặc vừa đúng thời điểm hết hạn)
        if (now.getTime() <= endDate.getTime()) {
          return {
            amount: 0,
            sessionId: activeSession._id.toString(),
            message: 'Đã thanh toán trước (Vé tháng hợp lệ)',
          }
        }

        // Case B: Đã HẾT HẠN -> Tính phí thời gian dôi ra
        const overstayMs = now.getTime() - endDate.getTime()

        // (Tùy chọn) Thêm thời gian ân hạn (Grace Period) - ví dụ 15 phút
        // Nếu khách ra trễ 5-10 phút sau khi hết hạn vé tháng thì châm chước.
        const GRACE_PERIOD_MS = 15 * 60 * 1000
        if (overstayMs <= GRACE_PERIOD_MS) {
          return {
            amount: 0,
            sessionId: activeSession._id.toString(),
            message: 'Vé tháng vừa hết hạn (Trong thời gian ân hạn)',
          }
        }

        // 1. Tính số giờ quá hạn (làm tròn lên)
        // Ví dụ: Hết hạn lúc 10:00, ra lúc 11:15 -> Dư 1h15p -> Tính 2 tiếng
        const overstayHours = Math.ceil(overstayMs / (1000 * 60 * 60))

        // 2. Tính toán lại giá dựa trên Policy đã lấy ở đầu hàm
        // (Hàm calculatePriceByPolicy lấy từ các bước trước)
        const amount = this.calculatePriceByPolicy(pricingPolicy, overstayHours)

        return {
          amount: amount,
          sessionId: activeSession._id.toString(),
          message: `Vé tháng hết hạn vào ${endDate.toLocaleString('vi-VN')}. Quá hạn ${overstayHours} giờ.`,
        }
      }

      if (reservation) {
        const now = new Date()
        const endTime = new Date(reservation.estimatedEndTime)

        // Tính thời gian quá giờ (milliseconds)
        const overstayMs = now.getTime() - endTime.getTime()

        // Cho phép trễ 15 phút miễn phí (Grace Period) - Tuỳ bạn cấu hình
        const GRACE_PERIOD_MS = 15 * 60 * 1000

        if (overstayMs <= GRACE_PERIOD_MS) {
          // Ra đúng giờ hoặc trễ trong mức cho phép
          return {
            amount: 0,
            sessionId: reservation._id.toString(),
            message: 'Đã thanh toán trước (Đúng giờ)',
          }
        } else {
          // --- XỬ LÝ RA TRỄ ---

          // 1. Tính số giờ trễ (làm tròn lên)
          const overstayHours = Math.ceil(overstayMs / (1000 * 60 * 60))

          // 2. Tính tiền phạt dựa trên policy
          // Lưu ý: Ta dùng hàm calculatePriceByPolicy đã viết ở bước trước
          // Tham số truyền vào là 'overstayHours' chứ không phải tổng thời gian gửi
          const extraFee = this.calculatePriceByPolicy(
            pricingPolicy,
            overstayHours,
          )

          return {
            amount: extraFee,
            sessionId: reservation._id.toString(),
            message: `Quá giờ ${overstayHours} tiếng`,
          }
        }
      }
    }

    // 3. Kiểm tra thẻ vãng lai/tháng (UidCard)
    if (uidCard) {
      const existCard = await this.guestCardService.findGuestCardByNfc(
        uidCard,
        parkingLotId,
      )
      if (!existCard) {
        throw new NotFoundException(
          `Thẻ có UID ${uidCard} chưa được đăng ký tại bãi xe này`,
        )
      }

      // Tìm session đang hoạt động
      const sessions =
        await this.parkingLotSessionRepository.findActiveSessionByUidCard(
          existCard._id,
          parkingLotId,
        )

      if (sessions && sessions.length > 0) {
        const currentSession = sessions[0] // Lấy session đầu tiên/gần nhất

        // --- BẮT ĐẦU TÍNH TOÁN ---
        // Giả sử trong session có trường checkInTime là Date
        const checkInTime = new Date(currentSession.checkInTime)
        const checkOutTime = new Date() // Thời gian hiện tại

        // Tính thời gian gửi xe (đơn vị: giờ)
        // Math.abs để đảm bảo dương, chia cho 36e5 để đổi ms sang giờ
        const durationMs = checkOutTime.getTime() - checkInTime.getTime()
        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60))
        // Lưu ý: durationHours = 0 thì có thể coi là 1 hoặc miễn phí tuỳ nghiệp vụ, ở đây tôi để tối thiểu là 1 giờ nếu cần.
        const finalDuration = durationHours <= 0 ? 1 : durationHours

        const amount = this.calculatePriceByPolicy(pricingPolicy, finalDuration)

        return {
          amount: amount,
          sessionId: currentSession._id.toString(),
        }
      }
    }

    throw new NotFoundException('Phiên đỗ xe đang hoạt động không tồn tại.')
  }

  async confirmCheckout(
    sessionId: string,
    userId: string,
    file: Express.Multer.File,
    paymentId?: string,
    pricingPolicyId?: string,
    amountPayAfterCheckOut?: number,
  ): Promise<boolean> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      // 1. Lấy session
      const parkingSession = await this.parkingLotSessionRepository.findById(
        sessionId,
        session,
      )

      if (!parkingSession) {
        throw new NotFoundException('Phiên đỗ xe không tồn tại.')
      }

      if (parkingSession.status !== ParkingSessionStatusEnum.ACTIVE) {
        throw new ConflictException(
          'Phiên đỗ xe đã được thanh toán hoặc không còn hoạt động.',
        )
      }

      if (parkingSession.subscriptionId) {
        const sub = await this.subscriptionRepository.findSubscriptionById(
          parkingSession.subscriptionId,
        )
        if (!sub) {
          throw new NotFoundException('Vé tháng không tồn tại.')
        }
        await this.subscriptionRepository.updateUsageStatus(
          sub.subscriptionIdentifier,
          false,
          session,
        )
      }

      if (parkingSession.reservationId) {
        const res = await this.reservationRepository.findReservationById(
          parkingSession.reservationId,
        )
        if (!res) {
          throw new NotFoundException('Đặt trước không tồn tại.')
        }
        await this.reservationRepository.updateReservationStatus(
          res._id,
          ReservationStatusEnum.CHECKED_OUT,
          'SYSTEM',
          session,
        )

        if (res.createdBy) {
          const pointChange = this.calculateReputationDelta(
            res.estimatedEndTime,
            new Date(),
          )

          if (pointChange.change !== 0) {
            // 3. Gọi bất đồng bộ (KHÔNG await) để không chặn luồng check-out
            // Kèm theo catch lỗi để không crash app nếu service kia chết
            this.accountServiceClient
              .updateUserCreditPoints(res.createdBy, pointChange.change)
              .then(() => {
                this.logger.log(
                  `Đã cập nhật điểm uy tín cho user ${res.createdBy}: ${pointChange.change}`,
                )
              })
              .catch((err) => {
                this.logger.error(
                  `Lỗi cập nhật điểm uy tín (Background task): ${err.message}`,
                )
              })
          }
        }
      }

      if (paymentId) {
        const paymentData =
          await this.accountServiceClient.getPaymentStatusByPaymentId(
            paymentId,
            userId,
            'PAID',
          )
        if (!paymentData.isValid) {
          throw new ConflictException('Thanh toán chưa hoàn tất.')
        }
      }
      // 2. Cập nhật session
      const data =
        await this.parkingLotSessionRepository.updateSessionOnCheckout(
          sessionId,
          {
            status: ParkingSessionStatusEnum.COMPLETED,
            checkOutTime: new Date(),
            paymentStatus: PaymentStatusEnum.PAID,
            pricingPolicyId: pricingPolicyId,
            amountPayAfterCheckOut: amountPayAfterCheckOut,
          },
          session,
        )

      await this.uploadImageToImageService(
        file,
        parkingSession._id.toString(), // Owner ID là Session ID
        'ParkingSession', // Owner Type
        'Check-out từ Kiosk Bảo Vệ', // Description
      )

      if (parkingSession.reservationId) {
        await this.parkingTransactionRepository.createTransaction(
          {
            reservationId: parkingSession.reservationId,
            parkingLotId: parkingSession.parkingLotId,
            amount:
              amountPayAfterCheckOut && amountPayAfterCheckOut > 0
                ? amountPayAfterCheckOut
                : 0,
            type: TransactionTypeEnum.PENALTY,
            paymentId: paymentId,
          },
          session,
        )
      } else if (parkingSession.subscriptionId) {
        await this.parkingTransactionRepository.createTransaction(
          {
            subscriptionId: parkingSession.subscriptionId,
            parkingLotId: parkingSession.parkingLotId,
            amount:
              amountPayAfterCheckOut && amountPayAfterCheckOut > 0
                ? amountPayAfterCheckOut
                : 0,
            type: TransactionTypeEnum.PENALTY,
            paymentId: paymentId,
          },
          session,
        )
      } else if (parkingSession.guestCardId) {
        await this.parkingTransactionRepository.createTransaction(
          {
            sessionId: parkingSession._id.toString(),
            parkingLotId: parkingSession.parkingLotId,
            amount:
              amountPayAfterCheckOut && amountPayAfterCheckOut > 0
                ? amountPayAfterCheckOut
                : 0,
            type: TransactionTypeEnum.WALK_IN_PAYMENT,
            paymentId: paymentId,
          },
          session,
        )
      }
      if (!data) {
        throw new InternalServerErrorException(
          'Checkout thất bại, vui lòng thử lại.',
        )
      }

      const updateSpots =
        await this.parkingLotService.updateAvailableSpotsForWebsocket(
          parkingSession.parkingLotId,
          1,
        )

      if (!updateSpots) {
        this.logger.warn(
          `Cập nhật chỗ trống qua WebSocket thất bại cho bãi xe ${parkingSession.parkingLotId} khi checkout session ${sessionId}`,
        )
      }

      // 3. Commit transaction
      await session.commitTransaction()
      return true
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  findAllSessionsByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotSessionResponseDto[]
    pagination: PaginationDto
  }> {
    throw new Error('Method not implemented.')
  }

  async findAllSessionsByParkingLot(
    parkingLotId: string,
    paginationQuery: PaginationQueryDto,
    startDate: string,
    endDate: string,
    plateNumber?: string,
  ): Promise<{
    data: ParkingLotSessionResponseDto[]
    pagination: PaginationDto
  }> {
    const { page, pageSize } = paginationQuery
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const data =
      await this.parkingLotSessionRepository.findAllSessionsByParkingLotId(
        parkingLotId,
        page,
        pageSize,
        startDateObj,
        endDateObj,
        plateNumber,
      )

    return {
      data: data.data.map((session) => this.responseToDto(session)),
      pagination: {
        totalItems: data.total,
        totalPages: Math.ceil(data.total / pageSize),
        currentPage: page,
        pageSize: pageSize,
      },
    }
  }

  async getSessionDetailsWithImages(
    sessionId: string,
  ): Promise<ParkingLotSessionResponseDto & { images: any[] }> {
    const session = await this.parkingLotSessionRepository.findById(sessionId)

    if (!session) {
      throw new NotFoundException('Phiên đỗ xe không tồn tại.')
    }

    const images = await this.accountServiceClient.getImagesByOwner(
      'ParkingSession',
      sessionId,
    )

    return {
      ...this.responseToDto(session),
      images,
    }
  }

  async findActiveSession(
    parkingLotId: string,
    identifier?: string,
    uidCard?: string,
  ): Promise<{
    session: ParkingLotSessionResponseDto | null
    images: any[]
    type: 'SUBSCRIPTION' | 'RESERVATION' | 'WALK_IN' | null
  }> {
    if (!identifier && !uidCard) {
      throw new BadRequestException(
        'Vui lòng cung cấp Mã QR/Thẻ hợp lệ để tìm phiên đỗ xe.',
      )
    }
    if (identifier) {
      const reservation =
        await this.reservationRepository.findValidReservationForCheckIn(
          identifier,
        )
      const subscription =
        await this.subscriptionRepository.findActiveSubscriptionByIdentifier(
          identifier,
        )
      if (subscription) {
        if (subscription.parkingLotId !== parkingLotId) {
          throw new ConflictException('QR Vé tháng này không thuộc bãi xe này.')
        }
        const subscriptionStatus =
          await this.subscriptionRepository.findActiveAndInUsedSubscriptionByIdentifier(
            identifier,
          )
        if (!subscriptionStatus) {
          return {
            session: null,
            images: [],
            type: 'SUBSCRIPTION',
          }
        }
        const sessions =
          await this.parkingLotSessionRepository.findActiveSessionBySubscriptionId(
            subscription._id.toString(),
            parkingLotId,
          )
        if (!sessions) {
          return { session: null, images: [], type: 'SUBSCRIPTION' }
        }
        const images = await this.accountServiceClient.getImagesByOwner(
          'ParkingSession',
          sessions._id.toString(),
        )
        return {
          session: this.responseToDto(sessions),
          images: images,
          type: 'SUBSCRIPTION',
        }
      } else if (reservation) {
        const reservation =
          await this.reservationRepository.findValidReservationForCheckIn(
            identifier,
          )
        if (!reservation) {
          return { session: null, images: [], type: 'RESERVATION' }
        }

        if (reservation.parkingLotId !== parkingLotId) {
          throw new ConflictException('QR Đặt trước không dùng cho bãi xe này.')
        }

        if (reservation.userExpectedTime > new Date()) {
          throw new BadRequestException(
            'Phiên đặt trước chưa đến thời gian sử dụng.',
          )
        }

        const sessions =
          await this.parkingLotSessionRepository.findActiveSessionByReservationId(
            reservation._id.toString(),
            parkingLotId,
          )
        if (!sessions) {
          return { session: null, images: [], type: 'RESERVATION' }
        }

        const images = await this.accountServiceClient.getImagesByOwner(
          'ParkingSession',
          sessions._id,
        )

        return {
          session: this.responseToDto(sessions),
          images: images,
          type: 'RESERVATION',
        }
      }
    }
    if (uidCard) {
      const existCard = await this.guestCardService.findGuestCardByNfc(
        uidCard,
        parkingLotId,
      )
      if (!existCard) {
        throw new NotFoundException(
          `Thẻ có UID ${uidCard} chưa được đăng ký tại bãi xe này`,
        )
      }
      const sessions =
        await this.parkingLotSessionRepository.findActiveSessionByUidCard(
          existCard._id,
          parkingLotId,
        )

      if (!sessions || sessions.length === 0) {
        return { session: null, images: [], type: 'WALK_IN' }
      }

      const images = await this.accountServiceClient.getImagesByOwner(
        'ParkingSession',
        sessions[0]?._id,
      )
      if (sessions.length > 0) {
        return {
          session: this.responseToDto(sessions[0]),
          images,
          type: 'WALK_IN',
        }
      }
    }
    return { session: null, images: [], type: null }
  }
}
