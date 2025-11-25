/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { Cron } from '@nestjs/schedule'
import { plainToInstance } from 'class-transformer'
import { Connection } from 'mongoose'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { IBookingInventoryRepository } from '../bookingInventory/interfaces/ibookingInventory.repository'
import { IAccountServiceClient } from '../client/interfaces/iaccount-service-client'
import { IParkingLotRepository } from '../parkingLot/interfaces/iparkinglot.repository'
import { IPricingPolicyRepository } from '../pricingPolicy/interfaces/ipricingPolicy.repository'
import {
  ConfirmReservationPaymentDto,
  CreateReservationDto,
  ReservationAvailabilitySlotDto,
  ReservationDetailResponseDto,
  UpdateReservationStatusDto,
} from './dto/reservation.dto'
import { ReservationStatusEnum } from './enums/reservation.enum'
import { IReservationRepository } from './interfaces/ireservation.repository'
import { IReservationService } from './interfaces/ireservation.service'
import { Reservation } from './schemas/reservation.schema'

@Injectable()
export class ReservationService implements IReservationService {
  constructor(
    @Inject(IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @Inject(IBookingInventoryRepository)
    private readonly bookingInventoryRepository: IBookingInventoryRepository,
    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,
    @Inject(IPricingPolicyRepository)
    private readonly pricingPolicyRepository: IPricingPolicyRepository,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject(IAccountServiceClient)
    private readonly accountServiceClient: IAccountServiceClient,
  ) {}

  private readonly logger: Logger = new Logger(ReservationService.name)

  private returnToDto(reservation: Reservation): ReservationDetailResponseDto {
    // Chuyển đổi entity/model sang DTO (có thể dùng class-transformer nếu cần)
    return plainToInstance(ReservationDetailResponseDto, reservation, {
      excludeExtraneousValues: true,
    })
  }

  /**
   * Hàm helper (phụ) để tính giá Bậc thang (Tiered)
   * (Logic: Tính theo LŨY KẾ - Progressive, theo yêu cầu của bạn)
   */
  private calculateTieredPrice(
    policy: any, // Kiểu PricingPolicy đã populate
    durationInHours: number,
  ): number {
    if (!policy.tieredRateSetId?.tiers?.length) {
      throw new InternalServerErrorException(
        'Lỗi dữ liệu: Cơ sở TIERED nhưng không có bậc thang (tiers).',
      )
    }

    // Sắp xếp các bậc thang theo 'fromHour' (từ thấp đến cao)
    const sortedTiers = policy.tieredRateSetId.tiers.sort(
      (a: any, b: any) => parseFloat(a.fromHour) - parseFloat(b.fromHour),
    )

    let totalCost = 0
    let hoursAccountedFor = 0 // Số giờ đã được tính tiền

    // ⭐️ LOGIC LŨY KẾ: Dùng vòng lặp 'for' thay vì 'find'
    for (const tier of sortedTiers) {
      // Chuyển đổi (parsing)
      // (Giả sử fromHour/toHour là string, ví dụ '0', '5')
      const tierStartHour = parseFloat(tier.fromHour) // Ví dụ: Bậc 1 là 0
      const tierEndHour = tier.toHour ? parseFloat(tier.toHour) : Infinity // Ví dụ: Bậc 1 là 5
      const tierRate = tier.price // Ví dụ: 10000

      // Nếu tổng thời gian đỗ (7) > số giờ đã tính (0)
      if (durationInHours > hoursAccountedFor) {
        // 1. Tính toán thời gian áp dụng cho BẬC NÀY
        // (Không vượt quá 'tierStartHour', ví dụ: 0)
        const start = Math.max(hoursAccountedFor, tierStartHour)

        // (Không vượt quá 'tierEndHour' (5) VÀ không vượt quá tổng thời gian đỗ (7))
        const end = Math.min(durationInHours, tierEndHour)

        // 2. Lấy số giờ trong bậc này
        // (Lần lặp 1: end(5) - start(0) = 5 giờ)
        const hoursInThisTier = end - start

        // 3. Nếu có giờ nào trong bậc này, cộng tiền
        if (hoursInThisTier > 0) {
          totalCost += hoursInThisTier * tierRate // totalCost = 0 + (5 * 10000) = 50000
          hoursAccountedFor += hoursInThisTier // hoursAccountedFor = 0 + 5 = 5
        }
      } else {
        break // Đã tính xong
      }
    }

    // (Vòng lặp 2: tierStartHour = 5, tierEndHour = 8, tierRate = 15000)
    // 1. (durationInHours (7) > hoursAccountedFor (5)) -> True
    // 2. start = Math.max(5, 5) = 5
    // 3. end = Math.min(7, 8) = 7
    // 4. hoursInThisTier = end(7) - start(5) = 2 giờ
    // 5. totalCost = 50000 + (2 * 15000) = 80000
    // 6. hoursAccountedFor = 5 + 2 = 7

    // (Vòng lặp 3: tierStartHour = 8)
    // 1. (durationInHours (7) > hoursAccountedFor (7)) -> False
    // 2. break;

    // Trả về tổng chi phí
    if (totalCost === 0 && durationInHours > 0) {
      throw new BadRequestException(
        `Không tìm thấy mức giá bậc thang nào áp dụng cho ${String(durationInHours)} giờ.`,
      )
    }

    return totalCost // ⭐️ Trả về 80.000
  }

  async createReservation(
    createDto: CreateReservationDto,
    userId: string,
  ): Promise<ReservationDetailResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      // --- BƯỚC 1: LẤY QUY TẮC (RULES) ---
      // 1a. Lấy quy tắc của Bãi xe (Khóa bãi xe)
      const lot = await this.parkingLotRepository.findParkingLotById(
        createDto.parkingLotId,
        session, // ⭐️ Khóa (Lock) bãi xe
      )
      if (!lot) {
        throw new NotFoundException('Bãi đỗ xe không tồn tại.')
      }
      const bookableCapacityRule = lot.bookableCapacity // Quy tắc Xô 2 (ví dụ: 30)
      // (Đây là 'BookingSlotDuration' của Xô 1, nhưng ta sẽ dùng '1 giờ' cho Xô 2)

      // 1b. Lấy quy tắc của Chính sách giá (để tính tiền)
      const policy = await this.pricingPolicyRepository.getPolicyDetailsById(
        createDto.pricingPolicyId,
      )
      if (!policy?.basisId) {
        throw new BadRequestException('Chính sách giá không hợp lệ.')
      }
      // (Kiểm tra: Đảm bảo đây không phải là gói PACKAGE)
      const basisName =
        typeof policy.basisId === 'string'
          ? policy.basisId
          : (policy.basisId as any)?.basisName
      if (basisName === 'PACKAGE') {
        throw new BadRequestException(
          'Không thể dùng gói (Package) để đặt chỗ (Reservation).',
        )
      }

      // --- BƯỚC 2: TÍNH TOÁN & CHUẨN HÓA ---
      const startTime = new Date(createDto.userExpectedTime)
      const endTime = new Date(createDto.estimatedEndTime)

      if (endTime <= startTime) {
        throw new BadRequestException(
          'Thời gian kết thúc phải sau thời gian bắt đầu.',
        )
      }

      // Tính toán số tiền trả trước (Logic này cần được triển khai)

      // Chuẩn hóa thời gian về 00 phút (để kiểm tra Kho)
      const inventoryStartTime = new Date(startTime.getTime())
      inventoryStartTime.setMinutes(0, 0, 0) // 9:15 -> 9:00

      const inventoryEndTime = new Date(endTime.getTime())
      inventoryEndTime.setMinutes(0, 0, 0) // 11:30 -> 11:00

      // --- BƯỚC 3: KIỂM TRA KHO (CHECK INVENTORY) ---
      // 3a. Lấy tất cả các slot bị ảnh hưởng
      const affectedInventories =
        await this.bookingInventoryRepository.findInventoriesInTimeRange(
          createDto.parkingLotId,
          inventoryStartTime, // 9:00
          inventoryEndTime, // 11:00 (Hàm sẽ lấy 9:00 và 10:00)
          session,
        )

      // 3b. Kiểm tra xem có slot nào bị đầy không
      for (const inventorySlot of affectedInventories) {
        if (inventorySlot.bookedCount >= bookableCapacityRule) {
          throw new ConflictException(
            `Đã hết chỗ cho khung giờ: ${inventorySlot.timeSlot.toISOString()}`,
          )
        }
      }
      // (Lưu ý: Ngay cả khi 'affectedInventories' rỗng (chưa ai đặt), logic vẫn đúng)

      // --- BƯỚC 4: CẬP NHẬT KHO (ACT) ---
      // (Hàm này sẽ +1 'bookedCount' cho 9:00 và 10:00, và tạo nếu chưa có)
      await this.bookingInventoryRepository.updateInventoryCounts(
        createDto.parkingLotId,
        inventoryStartTime,
        inventoryEndTime, // ⭐️ Sửa 1: Cần 1 tham số 'endTime'
        1, // Tăng 1 slot
        session,
      )

      // --- BƯỚC 5: TẠO HÓA ĐƠN (RESERVATION DRAFT) ---
      const newReservation = await this.reservationRepository.createReservation(
        {
          parkingLotId: createDto.parkingLotId,
          createdBy: userId,
          pricingPolicyId: createDto.pricingPolicyId,
          promotionId: createDto.promotionId,
          inventoryTimeSlot: inventoryStartTime, // 9:00
          userExpectedTime: new Date(createDto.userExpectedTime),
          estimatedEndTime: new Date(createDto.estimatedEndTime),
          status: ReservationStatusEnum.PENDING_PAYMENT, // ⭐️ Chờ thanh toán
        },
        session,
      )

      if (!newReservation) {
        throw new InternalServerErrorException('Không thể tạo đơn đặt chỗ.')
      }

      await session.commitTransaction()
      return this.returnToDto(newReservation) // Trả về DTO
    } catch (error) {
      await session.abortTransaction()
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error // Ném lại các lỗi nghiệp vụ đã xử lý
      }
      throw new InternalServerErrorException(error.message)
    } finally {
      await session.endSession()
    }
  }

  async confirmReservationPayment(
    id: IdDto,
    confirmDto: ConfirmReservationPaymentDto,
    userId: string,
  ): Promise<boolean> {
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const reservation = await this.reservationRepository.findReservationById(
        id.id,
        session,
      )

      if (!reservation) {
        throw new NotFoundException('Đơn đặt chỗ không tồn tại.')
      }

      if (reservation.status !== ReservationStatusEnum.PENDING_PAYMENT) {
        throw new BadRequestException(
          'Đơn đặt chỗ không ở trạng thái chờ thanh toán.',
        )
      }

      // Cập nhật thông tin thanh toán
      const checkPaymentStatus =
        await this.accountServiceClient.getPaymentStatusByPaymentId(
          confirmDto.paymentId,
          userId,
          'PAID',
        )
      if (!checkPaymentStatus.isValid) {
        throw new BadRequestException(
          'Thanh toán không hợp lệ hoặc sai thông tin.',
        )
      }

      const prepaidAmount = checkPaymentStatus.amount

      const updatedReservation =
        await this.reservationRepository.updateReservationPaymentId(
          id.id,
          confirmDto.paymentId,
          prepaidAmount,
          session,
        )
      if (!updatedReservation) {
        throw new InternalServerErrorException(
          'Không thể cập nhật thông tin thanh toán cho đơn đặt chỗ.',
        )
      }
      await session.commitTransaction()
      return updatedReservation
    } catch (error) {
      await session.abortTransaction()
      if (error.code === 11000) {
        throw new ConflictException(
          'Thanh toán đã được được sử dụng cho đơn đặt chỗ khác.',
        )
      }
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error // Ném lại các lỗi nghiệp vụ đã xử lý
      }

      throw new InternalServerErrorException(error.message)
    } finally {
      await session.endSession()
    }
  }

  async findAllByUserId(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ReservationDetailResponseDto[]
    pagination: PaginationDto
  }> {
    const { page, pageSize } = paginationQuery
    const data = await this.reservationRepository.findAllByUserId(
      userId,
      page,
      pageSize,
    )

    return {
      data: data.data.map((reservation) => this.returnToDto(reservation)),
      pagination: {
        totalItems: data.total,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(data.total / pageSize),
      },
    }
  }

  async findReservationById(id: IdDto): Promise<ReservationDetailResponseDto> {
    const data = await this.reservationRepository.findReservationById(id.id)
    if (!data) {
      throw new NotFoundException('Đơn đặt chỗ không tồn tại.')
    }
    return this.returnToDto(data)
  }

  async findValidReservationForCheckIn(
    reservationIdentifier: string,
  ): Promise<ReservationDetailResponseDto> {
    const data =
      await this.reservationRepository.findValidReservationForCheckIn(
        reservationIdentifier,
      )
    if (!data) {
      throw new NotFoundException(
        'Không tìm thấy đơn đặt chỗ hợp lệ để làm thủ tục vào.',
      )
    }
    return this.returnToDto(data)
  }

  async cancelReservationByUser(id: IdDto, userId: string): Promise<boolean> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      // --- BƯỚC 1: LẤY VÉ (RESERVATION) ---
      // (Lấy bản ghi, khóa nó lại bằng session)
      const reservation = await this.reservationRepository.findReservationById(
        id.id,
        session, // ⭐️ Rất quan trọng: Khóa bản ghi này
      )

      if (!reservation) {
        throw new NotFoundException('Không tìm thấy đơn đặt chỗ.')
      }

      // --- BƯỚC 2: KIỂM TRA TRẠNG THÁI (GUARD CLAUSES) ---
      // Chỉ cho hủy nếu vé đang PENDING hoặc CONFIRMED
      if (
        reservation.status !== ReservationStatusEnum.PENDING_PAYMENT &&
        reservation.status !== ReservationStatusEnum.CONFIRMED
      ) {
        throw new ConflictException(
          'Không thể hủy: Vé này đã được check-in, đã hết hạn hoặc đã bị hủy trước đó.',
        )
      }

      // --- BƯỚC 3: KIỂM TRA QUY TẮC CẮT GIỜ (LOGIC CỦA BẠN) ---
      const CANCELLATION_CUTOFF_MINUTES = 15 // ⭐️ Quy tắc 15 phút
      const now = new Date()
      const expectedTime = new Date(reservation.userExpectedTime)

      // Tính số mili-giây còn lại
      const timeRemainingMs = expectedTime.getTime() - now.getTime()
      const timeRemainingMinutes = timeRemainingMs / (1000 * 60)

      if (timeRemainingMinutes <= CANCELLATION_CUTOFF_MINUTES) {
        throw new BadRequestException(
          `Không thể hủy. Đã quá sát giờ (còn ${CANCELLATION_CUTOFF_MINUTES} phút).`,
        )
      }

      // --- BƯỚC 4: HÀNH ĐỘNG (ACT) ---

      // 4a. Cập nhật "Vé" -> HỦY
      await this.reservationRepository.updateReservationStatus(
        id.id,
        ReservationStatusEnum.CANCELLED_BY_USER,
        userId,
        session,
      )

      // 4b. TRẢ LẠI "SLOT" CHO KHO (Rất quan trọng)
      // (Chỉ trả slot nếu vé đã được xác nhận, vì PENDING chưa lấy slot)
      if (reservation.status === ReservationStatusEnum.CONFIRMED) {
        // (Bạn cần tính lại inventoryStartTime/EndTime dựa trên vé)
        const inventoryStartTime = new Date(reservation.inventoryTimeSlot)
        const inventoryEndTime = new Date(reservation.estimatedEndTime)
        inventoryEndTime.setMinutes(0, 0, 0) // Chuẩn hóa về 00 phút
        // (Bạn cần logic để lấy lại 'estimatedEndTime' và 'blockSize')

        await this.bookingInventoryRepository.updateInventoryCounts(
          reservation.parkingLotId,
          inventoryStartTime,
          inventoryEndTime,
          -1, // ⭐️ Trừ 1 (TRẢ SLOT)
          session,
        )
      }

      // (4c. Xử lý Hoàn tiền - Gọi Payment Service để refund 'paymentId')
      // if (reservation.paymentId) {
      //   await this.paymentService.requestRefund(reservation.paymentId);
      // }

      await session.commitTransaction()
      return true
    } catch (error) {
      await session.abortTransaction()
      throw error // Ném lại lỗi (404, 400, 409...)
    } finally {
      await session.endSession()
    }
  }

  async updateReservationStatusByAdmin(
    id: IdDto,
    updateDto: UpdateReservationStatusDto,
    userId: string,
  ): Promise<boolean> {
    const data = await this.reservationRepository.findReservationById(id.id)
    if (!data) {
      throw new NotFoundException('Đơn đặt chỗ không tồn tại.')
    }
    // Cập nhật trạng thái
    const session = await this.connection.startSession()
    session.startTransaction()
    try {
      const updatedReservation =
        await this.reservationRepository.updateReservationStatusForAdmin(
          id.id,
          userId,
          updateDto.status,
          session,
        )
      if (!updatedReservation) {
        throw new InternalServerErrorException(
          'Không thể cập nhật trạng thái đơn đặt chỗ.',
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

  @Cron('0 */3 * * * *')
  async updateOverdueReservationsToExpired(): Promise<void> {
    this.logger.log(
      '[CronJob] Bắt đầu dọn dẹp các reservation PENDING_PAYMENT quá hạn...',
    )

    // 1. Tính thời gian "cắt" (10 phút trước)
    const TEN_MINUTES_AGO_MS = 10 * 60 * 1000
    const cutoffTime = new Date(Date.now() - TEN_MINUTES_AGO_MS)

    try {
      // 2. Gọi hàm Repository (đã sửa)
      const result =
        await this.reservationRepository.updateExpiredPendingReservations(
          cutoffTime,
        )

      if (result.modifiedCount > 0) {
        this.logger.log(
          `[CronJob] Đã hủy ${String(result.modifiedCount)} gói thuê bao quá hạn thanh toán.`,
        )
      }
    } catch (error) {
      this.logger.error(
        `[CronJob] Gặp lỗi khi dọn dẹp gói thuê bao: ${error.message}`,
        error.stack,
      )
    }
  }

  async getReservationAvailability(
    parkingLotId: string,
    dateStr: string, // Input dạng 'YYYY-MM-DD'
  ): Promise<Record<string, ReservationAvailabilitySlotDto>> {
    // ⭐️ Kiểu trả về Map

    // 1. Lấy Quy tắc (Rule)
    const lot = await this.parkingLotRepository.findParkingLotById(parkingLotId)
    if (!lot) {
      throw new NotFoundException('Bãi đỗ xe không tồn tại.')
    }
    const bookableCapacityRule = lot.bookableCapacity // Ví dụ: 30

    // 2. Xác định khoảng thời gian (00:00 -> 23:59 của ngày được chọn)
    const startOfDay = new Date(dateStr)

    if (isNaN(startOfDay.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ (Format: YYYY-MM-DD).')
    }

    if (startOfDay < new Date(new Date().toDateString())) {
      throw new BadRequestException(
        'Không thể kiểm tra tình trạng đặt chỗ cho ngày đã qua.',
      )
    }
    // Reset về đầu ngày (theo giờ Local/Server)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1) // Sang đầu ngày hôm sau

    // 3. Lấy Dữ liệu Tồn kho (1 lần gọi DB)
    const inventories =
      await this.bookingInventoryRepository.findInventoriesForAvailability(
        parkingLotId,
        startOfDay,
        endOfDay,
      )

    // 4. Xử lý trong bộ nhớ (In-memory)
    const availabilityMap: Record<string, ReservationAvailabilitySlotDto> = {}

    // Biến đổi mảng inventories thành Map để tra cứu nhanh (O(1))
    // Key: Giờ (0-23) -> Value: bookedCount
    const inventoryLookup = new Map<number, number>()
    inventories.forEach((inv) => {
      const hour = new Date(inv.timeSlot).getHours()
      inventoryLookup.set(hour, inv.bookedCount)
    })

    // Lặp 24 giờ trong ngày
    for (let i = 0; i < 24; i++) {
      // Lấy số lượng đã đặt (nếu không có trong DB nghĩa là 0)
      const bookedCount = inventoryLookup.get(i) ?? 0

      // Tính toán số suất còn lại
      const remaining = Math.max(0, bookableCapacityRule - bookedCount)

      // Logic: Còn chỗ (>0) VÀ Giờ đó chưa trôi qua (Optional)
      // (Ở đây tôi giữ logic đơn giản là còn chỗ thì true)
      const isAvailable = remaining > 0

      // Tạo key giờ đẹp (ví dụ: "09:00")
      const hourKey = i.toString().padStart(2, '0') + ':00'

      availabilityMap[hourKey] = { remaining, isAvailable }
    }

    return availabilityMap
  }
}
