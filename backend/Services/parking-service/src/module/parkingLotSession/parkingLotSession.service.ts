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
import { Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'

import { IAccountServiceClient } from '../client/interfaces/iaccount-service-client'
import { IParkingLotRepository } from '../parkingLot/interfaces/iparkinglot.repository'
import { IParkingLotService } from '../parkingLot/interfaces/iparkingLot.service'
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
    if (!file) return null

    try {
      // Gửi request multipart/form-data
      const response: any =
        await this.accountServiceClient.uploadImageToImageService(
          file.buffer,
          ownerType,
          ownerId,
          description ?? '',
        )
      if (response.status !== 201) {
        throw new Error(
          `Upload ảnh thất bại với mã trạng thái: ${response.status}`,
        )
      }
      return response?.data
    } catch (error) {
      // Chỉ log lỗi, không ném exception (để tránh làm user tưởng check-in thất bại)
      this.logger.error(
        `[ImageProxy] Upload ảnh thất bại cho ${ownerType} ${ownerId}: ${error.message}`,
      )
      return null
    }
  }

  /**
   * Check-in cho khách Vãng lai (Xô 3).
   * - Kiểm tra walkInCapacity.
   * - Tạo Session (Trả sau).
   * - Upload ảnh (Proxy).
   */
  async checkIn(
    parkingLotId: string,
    dto: CheckInDto, // ⭐️ DTO tổng hợp (plateNumber?, identifier?, description?)
    file: Express.Multer.File,
  ): Promise<ParkingLotSessionResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()

    let newSession: ParkingLotSession | null = null

    try {
      // 1. Lấy thông tin bãi xe
      const lot = await this.parkingLotRepository.findParkingLotById(
        parkingLotId,
        session,
      )
      if (!lot) throw new NotFoundException('Bãi đỗ xe không tồn tại.')

      // =================================================================
      // A. XỬ LÝ CHECK-IN BẰNG QR (XÔ 1 & 2)
      // =================================================================
      if (dto.identifier) {
        // A1. Thử tìm trong SUBSCRIPTION (Xô 1)
        const sub =
          await this.subscriptionRepository.findActiveSubscriptionByIdentifier(
            dto.identifier,
          )

        if (sub) {
          // ==> ĐÂY LÀ VÉ THÁNG
          if (sub.parkingLotId !== parkingLotId) {
            throw new ConflictException('Vé tháng này không thuộc bãi xe này.')
          }
          if (sub.isUsed) {
            throw new ConflictException(
              'Vé tháng này đang được sử dụng (xe chưa ra).',
            )
          }

          // Cập nhật Subscription -> isUsed = true
          await this.subscriptionRepository.updateUsageStatus(
            sub.subscriptionIdentifier,
            true,
            session,
          )

          // Tạo Session (Xô 1)
          newSession = await this.parkingLotSessionRepository.createSession(
            {
              parkingLotId,
              plateNumber: dto.plateNumber ?? 'QR-CHECKIN', // Ưu tiên biển số OCR nếu có
              checkInTime: new Date(),
              status: ParkingSessionStatusEnum.ACTIVE,
              paymentStatus: PaymentStatusEnum.NOT_APPLICABLE, // Vé tháng
              subscriptionId: sub._id, // ⭐️ Liên kết Xô 1
              reservationId: undefined,
            },
            session,
          )
        }
        // A2. Nếu không phải Xô 1, thử tìm trong RESERVATION (Xô 2)
        else {
          const res =
            await this.reservationRepository.findValidReservationForCheckIn(
              dto.identifier,
            )

          if (res) {
            // ==> ĐÂY LÀ VÉ ĐẶT TRƯỚC
            if (res.parkingLotId !== parkingLotId) {
              throw new ConflictException(
                'Vé đặt trước này không thuộc bãi xe này.',
              )
            }
            // (Tùy chọn: Kiểm tra giờ đến trễ)
            // if (new Date() > res.estimatedEndTime) ...

            // Cập nhật Reservation -> CHECKED_IN
            await this.reservationRepository.updateReservationStatus(
              res._id,
              ReservationStatusEnum.CHECKED_IN,
              'SYSTEM', // updatedBy
              session,
            )

            // Tạo Session (Xô 2)
            newSession = await this.parkingLotSessionRepository.createSession(
              {
                parkingLotId,
                plateNumber: dto.plateNumber ?? 'QR-CHECKIN',
                checkInTime: new Date(),
                status: ParkingSessionStatusEnum.ACTIVE,
                paymentStatus: PaymentStatusEnum.PREPAID, // Đã trả trước
                reservationId: res._id, // ⭐️ Liên kết Xô 2
                subscriptionId: undefined,
              },
              session,
            )
          }
        }
      }

      // =================================================================
      // B. XỬ LÝ CHECK-IN VÃNG LAI (XÔ 3) - FALLBACK
      // =================================================================
      // Nếu chưa tạo được session (do không có QR hoặc QR lỗi) VÀ có biển số xe
      if (!newSession && dto.plateNumber) {
        // B1. Kiểm tra Xô 3 (Walk-in Capacity)
        const currentWalkIns =
          await this.parkingLotSessionRepository.countActiveWalkInSessions(
            parkingLotId,
            session,
          )

        if (currentWalkIns >= lot.walkInCapacity) {
          throw new ConflictException('Đã hết chỗ dành cho khách vãng lai.')
        }

        // B2. Tạo Session (Xô 3)
        newSession = await this.parkingLotSessionRepository.createSession(
          {
            parkingLotId,
            plateNumber: dto.plateNumber ? dto.plateNumber : undefined,
            checkInTime: new Date(),
            status: ParkingSessionStatusEnum.ACTIVE,
            paymentStatus: PaymentStatusEnum.PENDING, // ⭐️ Trả sau
            reservationId: undefined,
            subscriptionId: undefined,
          },
          session,
        )
      }

      // =================================================================
      // C. KIỂM TRA KẾT QUẢ CUỐI CÙNG
      // =================================================================
      if (!newSession) {
        // Nếu có QR mà không tìm thấy -> Báo lỗi QR
        if (dto.identifier) {
          throw new NotFoundException(
            'Mã QR không hợp lệ hoặc vé đã hết hạn/đã dùng.',
          )
        }
        // Nếu không có QR và không có biển số -> Báo lỗi thiếu info
        throw new BadRequestException(
          'Vui lòng cung cấp Mã QR hoặc Biển số xe để check-in.',
        )
      }

      // D. Commit Transaction
      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }

    // =================================================================
    // CÁC TÁC VỤ SAU KHI COMMIT (Non-blocking)
    // =================================================================

    // 1. Cập nhật hiển thị (-1 chỗ)
    try {
      await this.parkingLotService.updateAvailableSpotsForWebsocket(
        parkingLotId,
        -1,
      )
    } catch {
      // Chỉ log lỗi, không ném exception (để tránh làm user tưởng check-in thất bại)
      this.logger.error(
        `Cập nhật hiển thị chỗ trống thất bại cho bãi xe ${parkingLotId}.`,
      )
    }

    // 2. Upload ảnh sang Image Service
    if (file && newSession) {
      const ownerType = 'ParkingSession' // Luôn dùng ParkingSession cho đơn giản
      // Hoặc phân loại: newSession.subscriptionId ? 'SubscriptionSession' : ...

      await this.uploadImageToImageService(
        file,
        newSession._id,
        ownerType,
        dto.description ?? 'Check-in',
      )
    }

    // 3. Trả về kết quả
    return this.responseToDto(newSession)
  }

  calculateWalkInCheckoutFee(
    plateNumber: string,
    parkingLotId: string,
  ): Promise<any> {
    throw new Error('Method not implemented.')
  }

  confirmWalkInCheckout(
    sessionId: string,
    paymentId: string,
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
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

  findAllSessionsByParkingLot(
    parkingLotId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotSessionResponseDto[]
    pagination: PaginationDto
  }> {
    throw new Error('Method not implemented.')
  }

  getSessionDetailsWithImages(
    sessionId: string,
  ): Promise<ParkingLotSessionResponseDto & { images: any[] }> {
    throw new Error('Method not implemented.')
  }
}
