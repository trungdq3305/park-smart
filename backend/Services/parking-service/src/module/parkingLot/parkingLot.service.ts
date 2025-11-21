/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose' // Import InjectConnection
import { Cron, CronExpression } from '@nestjs/schedule'
import { plainToInstance } from 'class-transformer'
import { randomBytes } from 'crypto'
import { ClientSession, Connection } from 'mongoose' // Import Connection
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto, ParkingLotIdDto } from 'src/common/dto/params.dto'

import { IAddressRepository } from '../address/interfaces/iaddress.repository'
import { IParkingLotSessionRepository } from '../parkingLotSession/interfaces/iparkingLotSession.repository'
import {
  IParkingSpaceRepository,
  ParkingSpaceCreationAttributes,
} from '../parkingSpace/interfaces/iparkingSpace.repository'
import { IParkingSpaceStatusRepository } from '../parkingSpaceStatus/interfaces/iparkingSpaceStatus.repository'
import {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDeleteRequestDto,
  CreateParkingLotDto,
  CreateParkingLotUpdateRequestDto,
  ParkingLotHistoryLogResponseDto,
  ParkingLotRequestResponseDto,
  ParkingLotResponseDto,
  ParkingLotSpotsUpdateDto,
  ReviewRequestDto,
} from './dto/parkingLot.dto'
import { RequestStatus, RequestType } from './enums/parkingLot.enum'
import { IParkingLotRepository } from './interfaces/iparkinglot.repository'
import { IParkingLotService } from './interfaces/iparkingLot.service'
import { IParkingLotHistoryLogRepository } from './interfaces/iparkingLotHistoryLog.repository'
import { IParkingLotRequestRepository } from './interfaces/iparkingLotRequest.repository'
import { ParkingLotGateway } from './parkingLot.gateway'
import { ParkingLot } from './schemas/parkingLot.schema'
import { ParkingLotHistoryLog } from './schemas/parkingLotHistoryLog.schema'
import { ParkingLotRequest } from './schemas/parkingLotRequest.schema'
@Injectable()
export class ParkingLotService implements IParkingLotService {
  private readonly logger = new Logger(ParkingLotService.name)
  constructor(
    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,
    @Inject(IParkingLotHistoryLogRepository)
    private readonly parkingLotHistoryLogRepository: IParkingLotHistoryLogRepository,
    @Inject(IAddressRepository)
    private readonly addressRepository: IAddressRepository,
    @Inject(IParkingSpaceRepository)
    private readonly parkingSpaceRepository: IParkingSpaceRepository,
    @Inject(IParkingSpaceStatusRepository)
    private readonly parkingSpaceStatusRepository: IParkingSpaceStatusRepository,
    @Inject(IParkingLotRequestRepository)
    private readonly parkingLotRequestRepository: IParkingLotRequestRepository,
    private readonly parkingLotGateway: ParkingLotGateway,
    @InjectConnection() private readonly connection: Connection,
    @Inject(IParkingLotSessionRepository)
    private readonly sessionRepository: IParkingLotSessionRepository,
  ) {}

  private returnParkingLotRequestResponseDto(
    parkingLotRequest: ParkingLotRequest,
  ): ParkingLotRequestResponseDto {
    return plainToInstance(ParkingLotRequestResponseDto, parkingLotRequest)
  }

  private returnParkingLotResponseDto(
    parkingLot: ParkingLot,
  ): ParkingLotResponseDto {
    return plainToInstance(ParkingLotResponseDto, parkingLot, {
      excludeExtraneousValues: true,
    })
  }

  private determineRoomForParkingLot(): string {
    return `room_${String(123456)}`
  }

  private async _createParkingSpaces(
    parkingLot: ParkingLot,
    session: ClientSession,
  ): Promise<void> {
    const spacesToCreate: ParkingSpaceCreationAttributes[] = []
    const defaultStatus =
      await this.parkingSpaceStatusRepository.findParkingSpaceStatusByStatus(
        'Trống',
      )
    if (!defaultStatus) {
      throw new InternalServerErrorException(
        'Trạng thái ô đỗ xe "Trống" không tồn tại',
      )
    }

    for (let level = 1; level <= parkingLot.totalLevel; level++) {
      const codePrefix = level === 1 ? 'G' : `L${(level - 1).toString()}`

      for (let i = 1; i <= parkingLot.totalCapacityEachLevel; i++) {
        spacesToCreate.push({
          parkingLotId: parkingLot._id,
          parkingSpaceStatusId: defaultStatus,
          code: `${codePrefix}-${i.toString()}`,
          level: level,
        })
      }
    }

    if (spacesToCreate.length > 0) {
      await this.parkingSpaceRepository.createMany(spacesToCreate, session)
    }
  }

  async createCreateRequest(
    createDto: CreateParkingLotDto,
  ): Promise<ParkingLotRequestResponseDto> {
    // 1. KIỂM TRA ĐIỀU KIỆN TRƯỚC
    const addressExist = await this.addressRepository.findAddressById(
      createDto.addressId,
    )
    if (!addressExist) {
      throw new NotFoundException('Địa chỉ không tồn tại.')
    }

    if (
      createDto.bookableCapacity +
        createDto.leasedCapacity +
        createDto.walkInCapacity >
      createDto.totalCapacityEachLevel * createDto.totalLevel
    ) {
      throw new ConflictException(
        'Số suất trong các loại chỉ định không được vượt quá tổng sức chứa của bãi đỗ xe.',
      )
    }

    // (SỬA ĐỔI) Khai báo biến để lưu kết quả ở ngoài
    let parkingLotRequest: ParkingLotRequest

    // 2. BẮT ĐẦU TRANSACTION
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      const { effectiveDate, ...payloadData } = createDto
      const payload = { ...payloadData }

      const requestData: Partial<ParkingLotRequest> = {
        payload: payload,
        effectiveDate: new Date(effectiveDate),
        requestType: RequestType.CREATE,
        status: RequestStatus.PENDING,
      }

      // (SỬA ĐỔI) Gán kết quả vào biến, không return ngay
      parkingLotRequest =
        await this.parkingLotRequestRepository.createNewRequest(
          requestData,
          session,
        )

      await this.addressRepository.setAddressAsUsed(
        createDto.addressId,
        session,
      )

      // Commit transaction
      await session.commitTransaction()
    } catch (error) {
      // Nếu có lỗi, hủy bỏ transaction
      await session.abortTransaction()
      console.error('Lỗi khi tạo yêu cầu bãi đỗ xe:', error)
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình tạo yêu cầu bãi đỗ xe.',
      )
    } finally {
      // Luôn luôn kết thúc session
      await session.endSession()
    }

    // (SỬA ĐỔI) Trả về kết quả SAU KHI transaction đã kết thúc an toàn
    return this.returnParkingLotRequestResponseDto(parkingLotRequest)
  }

  async createUpdateRequest(
    parkingLotId: ParkingLotIdDto,
    updateRequestDto: CreateParkingLotUpdateRequestDto,
    userId: string,
    operatorId: string,
  ): Promise<ParkingLotRequestResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()
    let parkingLotRequest: ParkingLotRequest

    const existingParkingLot =
      await this.parkingLotRepository.findParkingLotById(
        parkingLotId.parkingLotId,
      )

    if (!existingParkingLot) {
      throw new NotFoundException('Bãi đỗ xe không tồn tại.')
    }

    try {
      const { effectiveDate, ...payloadData } = updateRequestDto
      const payload = { ...payloadData, operatorId }

      const requestData: Partial<ParkingLotRequest> = {
        payload: payload,
        effectiveDate: new Date(effectiveDate),
        requestType: RequestType.UPDATE,
        status: RequestStatus.PENDING,
        createdBy: userId,
        parkingLotId: parkingLotId.parkingLotId,
      }

      // (SỬA ĐỔI) Gán kết quả vào biến, không return ngay
      parkingLotRequest =
        await this.parkingLotRequestRepository.createNewRequest(
          requestData,
          session,
        )

      // Commit transaction
      await session.commitTransaction()
    } catch (error) {
      // Nếu có lỗi, hủy bỏ transaction
      await session.abortTransaction()
      console.error('Lỗi khi tạo yêu cầu bãi đỗ xe:', error)
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình tạo yêu cầu bãi đỗ xe.',
      )
    } finally {
      // Luôn luôn kết thúc session
      await session.endSession()
    }

    // (SỬA ĐỔI) Trả về kết quả SAU KHI transaction đã kết thúc an toàn
    return this.returnParkingLotRequestResponseDto(parkingLotRequest)
  }

  async createDeleteRequest(
    parkingLotId: ParkingLotIdDto,
    deleteRequestDto: CreateParkingLotDeleteRequestDto,
    userId: string,
  ): Promise<ParkingLotRequestResponseDto> {
    const session = await this.connection.startSession()
    session.startTransaction()

    let parkingLotRequest: ParkingLotRequest

    const existingParkingLot =
      await this.parkingLotRepository.findParkingLotById(
        parkingLotId.parkingLotId,
      )

    if (!existingParkingLot) {
      throw new NotFoundException('Bãi đỗ xe không tồn tại.')
    }

    try {
      const { effectiveDate } = deleteRequestDto

      const requestData: Partial<ParkingLotRequest> = {
        effectiveDate: new Date(effectiveDate),
        requestType: RequestType.DELETE,
        status: RequestStatus.PENDING,
        createdBy: userId,
        parkingLotId: parkingLotId.parkingLotId,
      }

      // (SỬA ĐỔI) Gán kết quả vào biến, không return ngay
      parkingLotRequest =
        await this.parkingLotRequestRepository.createNewRequest(
          requestData,
          session,
        )

      // Commit transaction
      await session.commitTransaction()
    } catch (error) {
      // Nếu có lỗi, hủy bỏ transaction
      await session.abortTransaction()
      console.error('Lỗi khi tạo yêu cầu bãi đỗ xe:', error)
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình tạo yêu cầu bãi đỗ xe.',
      )
    } finally {
      // Luôn luôn kết thúc session
      await session.endSession()
    }

    // (SỬA ĐỔI) Trả về kết quả SAU KHI transaction đã kết thúc an toàn
    return this.returnParkingLotRequestResponseDto(parkingLotRequest)
  }

  async reviewRequest(
    requestId: IdDto,
    reviewDto: ReviewRequestDto,
    userId: string,
  ): Promise<{ data: boolean; message: string; responseCode: number }> {
    const { status, rejectionReason } = reviewDto
    const data = await this.parkingLotRequestRepository.updateStatus(
      requestId.id,
      status,
      userId,
      rejectionReason,
    )
    if (!data) {
      throw new NotFoundException('Không tìm thấy yêu cầu hoặc đã được duyệt.')
    }
    return {
      data: true,
      message: 'Cập nhật trạng thái thành công',
      responseCode: 200,
    }
  }

  async getRequestsForParkingLot(
    parkingLotId: ParkingLotIdDto,
  ): Promise<ParkingLotRequestResponseDto[]> {
    const data = await this.parkingLotRequestRepository.findByParkingLotId(
      parkingLotId.parkingLotId,
    )
    return data.map((item) => this.returnParkingLotRequestResponseDto(item))
  }

  async getHistoryForParkingLot(
    parkingLotId: ParkingLotIdDto,
  ): Promise<ParkingLotHistoryLogResponseDto[]> {
    return await this.parkingLotHistoryLogRepository
      .findByParkingLotId(parkingLotId.parkingLotId)
      .then((logs) =>
        logs.map((log) =>
          plainToInstance(ParkingLotHistoryLogResponseDto, log, {
            excludeExtraneousValues: true,
          }),
        ),
      )
  }

  // --- HÀM LOGIC CỐT LÕI CHO CRON JOB (bạn đã có) ---
  // Trong file: parkingLot.service.ts

  async processApprovedRequests(): Promise<{
    processed: number
    failed: number
  }> {
    this.logger.log(
      `Starting to process approved requests at ${new Date().toISOString()}`,
    )
    const requests =
      await this.parkingLotRequestRepository.findApprovedAndDueRequests()

    if (requests.length === 0) {
      this.logger.log('No requests to process.')
      return { processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0
    for (const request of requests) {
      const session = await this.connection.startSession()
      session.startTransaction()
      try {
        let parkingLotId_for_log: string
        // =================================================================
        // == BẮT ĐẦU LOGIC XỬ LÝ THEO LOẠI YÊU CẦU
        // =================================================================
        if (request.requestType === RequestType.CREATE) {
          // --- XỬ LÝ CHO YÊU CẦU TẠO MỚI ---
          if (!request.payload) {
            throw new Error('Dữ liệu để tạo bãi đỗ xe không tồn tại')
          }
          const generatedKey = randomBytes(32).toString('hex')
          const newParkingLotData: Partial<ParkingLot> = {
            ...request.payload,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parkingLotOperatorId: request.payload.parkingLotOperatorId, // Lấy operatorId từ request
            // Giả sử trạng thái ban đầu là 'Đã duyệt'
            availableSpots:
              request.payload.totalCapacityEachLevel *
              request.payload.totalLevel,
            parkingLotStatus: RequestStatus.APPROVED,
            totalCapacity:
              request.payload.totalCapacityEachLevel *
              request.payload.totalLevel,
            secretKey: generatedKey,
          }

          const newParkingLot =
            await this.parkingLotRepository.createParkingLot(
              newParkingLotData,
              session, // Truyền session
            )

          if (!newParkingLot) {
            throw new Error('Failed to create ParkingLot document.')
          }

          // Lấy ID của bãi xe vừa tạo để ghi log
          parkingLotId_for_log = newParkingLot._id
          await this._createParkingSpaces(newParkingLot, session)
        } else if (request.requestType === RequestType[RequestType.UPDATE]) {
          // --- XỬ LÝ CHO YÊU CẦU CẬP NHẬT ---
          if (!request.parkingLotId) {
            throw new Error('Yêu cầu không liên kết với bãi đỗ xe nào')
          }

          parkingLotId_for_log = request.parkingLotId

          if (!request.payload) {
            throw new Error('Dữ liệu để cập nhật bãi đỗ xe không tồn tại')
          }
          const updatedParkingLot =
            await this.parkingLotRepository.updateParkingLot(
              parkingLotId_for_log,
              request.payload,
              session,
            )

          if (!updatedParkingLot) {
            throw new Error('Failed to update ParkingLot document.')
          }

          await this._createParkingSpaces(updatedParkingLot, session)
        } else {
          if (!request.parkingLotId) {
            throw new Error('Yêu cầu không liên kết với bãi đỗ xe nào')
          }
          // --- XỬ LÝ CHO YÊU CẦU XÓA ---
          if (!request.parkingLotId) {
            throw new Error('Yêu cầu không liên kết với bãi đỗ xe nào')
          }
          parkingLotId_for_log = request.parkingLotId

          await this.parkingLotRepository.deleteParkingLot(
            parkingLotId_for_log,
            session,
          )

          // --- (MỚI) Xử lý Parking Space cho DELETE: Xóa hết ---
          await this.parkingSpaceRepository.deleteByParkingLotId(
            parkingLotId_for_log,
            session,
          )
        }

        // =================================================================
        // == CÁC BƯỚC CHUNG SAU KHI XỬ LÝ THÀNH CÔNG
        // =================================================================

        // 1. Ghi lại vào History Log
        const logData: Partial<ParkingLotHistoryLog> = {
          parkingLotId: parkingLotId_for_log,
          requestId: request._id,
          eventType: request.requestType, // CREATE -> CREATED, etc.
          effectiveDate: request.effectiveDate,
          ...request.payload,
        }
        await this.parkingLotHistoryLogRepository.create(logData, session)

        // 2. Cập nhật trạng thái của Request thành APPLIED
        await this.parkingLotRequestRepository.updateStatus(
          request._id,
          RequestStatus.APPLIED,
          undefined,
          undefined,
          session,
        )

        // 3. Commit Transaction
        await session.commitTransaction()
        processed++
        this.logger.log(`Successfully processed request ${request._id}`)
      } catch (error) {
        await session.abortTransaction()
        failed++
        this.logger.error(
          `Failed to process request ${request._id}`,
          error.stack,
        )

        // Cập nhật trạng thái request thành FAILED để không xử lý lại
        await this.parkingLotRequestRepository.updateStatus(
          request._id,
          RequestStatus.FAILED,
          'SYSTEM',
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message?: unknown }).message)
            : undefined,
        )
      } finally {
        await session.endSession()
      }
    }

    this.logger.log(
      `Finished processing. Processed: ${String(processed)}, Failed: ${String(failed)}.`,
    )
    return { processed, failed }
  }

  // --- (MỚI) ĐÂY LÀ CRON JOB ---
  /**
   * Tự động chạy vào 1 giờ sáng mỗi ngày để xử lý các yêu cầu.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'processParkingLotRequests' })
  async handleCron() {
    this.logger.debug('Triggered CRON job: processParkingLotRequests')
    try {
      await this.processApprovedRequests()
    } catch (error) {
      this.logger.error('CRON job failed with an error:', error.stack)
    }
  }

  async getParkingLotDetails(id: IdDto): Promise<ParkingLotResponseDto> {
    const parkingLot = await this.parkingLotRepository.findParkingLotById(id.id)
    if (!parkingLot) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe')
    }
    return this.returnParkingLotResponseDto(parkingLot)
  }

  async getAllParkingLots(
    paginationQuery: PaginationQueryDto,
    parkingLotStatusId: string,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }> {
    const { data, total } =
      await this.parkingLotRepository.findAllParkingLotByStatus(
        paginationQuery.page,
        paginationQuery.pageSize,
        parkingLotStatusId,
      )
    if (data.length === 0) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe nào')
    }

    return {
      data: data.map((item) => this.returnParkingLotResponseDto(item)),
      pagination: {
        currentPage: paginationQuery.page,
        pageSize: paginationQuery.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / paginationQuery.pageSize),
      },
    }
  }

  async findNearbyParkingLots(
    coordinates: CoordinatesDto,
    paginationQuery: PaginationQueryDto,
    maxDistanceInKm: number,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }> {
    const data = await this.parkingLotRepository.findByCoordinates(
      coordinates.longitude,
      coordinates.latitude,
      paginationQuery.page,
      paginationQuery.pageSize,
      maxDistanceInKm,
      RequestStatus.APPROVED,
    )

    if (data.data.length === 0) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe nào gần vị trí này')
    }

    return {
      data: data.data.map((item) => this.returnParkingLotResponseDto(item)),
      pagination: {
        currentPage: paginationQuery.page,
        pageSize: paginationQuery.pageSize,
        totalItems: data.total,
        totalPages: Math.ceil(data.total / paginationQuery.pageSize),
      },
    }
  }

  async findParkingLotsInBounds(
    bounds: BoundingBoxDto,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }> {
    const bottomLeft: [number, number] = [
      bounds.bottomLeftLng, // Kinh độ (longitude) trước
      bounds.bottomLeftLat, // Vĩ độ (latitude) sau
    ]

    const topRight: [number, number] = [
      bounds.topRightLng, // Kinh độ (longitude) trước
      bounds.topRightLat, // Vĩ độ (latitude) sau
    ]

    const data = await this.parkingLotRepository.findInBounds(
      bottomLeft,
      topRight,
      paginationQuery.page,
      paginationQuery.pageSize,
      RequestStatus.APPROVED,
    )

    if (data.data.length === 0) {
      throw new NotFoundException(
        'Không tìm thấy bãi đỗ xe nào trong khu vực này',
      )
    }

    return {
      data: data.data.map((item) => this.returnParkingLotResponseDto(item)),
      pagination: {
        currentPage: paginationQuery.page,
        pageSize: paginationQuery.pageSize,
        totalItems: data.total,
        totalPages: Math.ceil(data.total / paginationQuery.pageSize),
      },
    }
  }

  async updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<boolean> {
    // ---------------------------------------------------------
    // BƯỚC 1: CẬP NHẬT VẬT LÝ (ATOMIC WRITE)
    // ---------------------------------------------------------
    const updatedLot = await this.parkingLotRepository.updateAvailableSpots(
      parkingLotId,
      change,
    )

    if (!updatedLot) {
      this.logger.warn(
        `Không thể cập nhật availableSpots cho bãi ${parkingLotId}`,
      )
      return false
    }

    // ---------------------------------------------------------
    // BƯỚC 2: TÍNH TOÁN CON SỐ "AN TOÀN" (DISPLAY SPOTS)
    // ---------------------------------------------------------
    // Lấy số xe vãng lai đang ở trong bãi
    const currentWalkIns =
      await this.sessionRepository.countActiveWalkInSessions(parkingLotId)

    const physicalAvailable = updatedLot.availableSpots // Số thực tế

    // Dư địa Xô 3 = Tổng Xô 3 - Đang dùng
    const walkInLimitRemaining = updatedLot.walkInCapacity - currentWalkIns

    // Con số an toàn = Min(Vật lý, Dư địa Vãng lai)
    const displaySpots = Math.max(
      0,
      Math.min(physicalAvailable, walkInLimitRemaining),
    )

    // ---------------------------------------------------------
    // ⭐️ BƯỚC 3: LƯU CON SỐ AN TOÀN VÀO DB (CACHE CHO MAP VIEW)
    // ---------------------------------------------------------
    // Bước này cực kỳ quan trọng để API "Get All Parking Lots" chạy nhanh.
    // Bạn cần viết thêm hàm updateDisplaySpots trong Repository của ParkingLot.
    try {
      await this.parkingLotRepository.updateParkingLot(parkingLotId, {
        displayAvailableSpots: displaySpots, // Lưu vào DB
      })
    } catch (error) {
      this.logger.error(
        `Lỗi cập nhật displayAvailableSpots cho bãi ${parkingLotId}: ${error.message}`,
      )
      // Không return false, vì logic chính đã xong, chỉ là lỗi cache
    }

    // ---------------------------------------------------------
    // BƯỚC 4: PHÁT SÓNG WEBSOCKET
    // ---------------------------------------------------------
    const roomName = `parking_lot_${parkingLotId}`

    const payload: ParkingLotSpotsUpdateDto = {
      _id: parkingLotId,
      // Khách thấy số này (An toàn)
      availableSpots: displaySpots,
      // Admin thấy số này (Thực tế)
      realAvailableSpots: physicalAvailable,
      // Admin thấy số này (Dư địa)
      walkInLimitRemaining: walkInLimitRemaining,
    }

    this.parkingLotGateway.sendSpotsUpdate(roomName, payload)

    return true
  }

  async findAllForOperator(
    operatorId: string,
  ): Promise<ParkingLotResponseDto[]> {
    const parkingLots =
      await this.parkingLotRepository.findAllForOperator(operatorId)
    if (parkingLots.length === 0) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe nào')
    }
    return parkingLots.map((item) => this.returnParkingLotResponseDto(item))
  }

  async getAllRequest(
    status: string,
    type: string,
  ): Promise<ParkingLotRequestResponseDto[]> {
    const requests = await this.parkingLotRequestRepository.findAllRequests(
      status,
      type,
    )
    if (requests.length === 0) {
      throw new NotFoundException('Không tìm thấy yêu cầu bãi đỗ xe nào')
    }
    return requests.map((item) => this.returnParkingLotRequestResponseDto(item))
  }

  hardDeleteRequestById(id: string): Promise<boolean> {
    return this.parkingLotRequestRepository.hardDeleteById(id)
  }

  async validateParkingKey(
    parkingId: string,
    secretKey: string,
  ): Promise<boolean> {
    const parkingLot =
      await this.parkingLotRepository.findParkingLotById(parkingId)
    if (!parkingLot) {
      throw new NotFoundException('Bãi đỗ xe không tồn tại')
    }
    if (parkingLot.secretKey !== secretKey) {
      return Promise.resolve(false)
    }
    return Promise.resolve(true)
  }
}
