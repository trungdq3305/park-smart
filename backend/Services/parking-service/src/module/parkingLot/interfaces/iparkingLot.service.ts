import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import type { IdDto, ParkingLotIdDto } from 'src/common/dto/params.dto'

import type {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDeleteRequestDto,
  CreateParkingLotDto,
  CreateParkingLotUpdateRequestDto,
  ParkingLotHistoryLogResponseDto,
  ParkingLotRequestResponseDto,
  ParkingLotResponseDto,
  ReviewRequestDto,
} from '../dto/parkingLot.dto'

export interface IParkingLotService {
  // =================================================================
  // == Core ParkingLot Read Operations (Giữ nguyên)
  // =================================================================

  getParkingLotDetails(id: IdDto): Promise<ParkingLotResponseDto>

  getAllParkingLots(
    paginationQuery: PaginationQueryDto,
    parkingLotStatusId: string,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  findNearbyParkingLots(
    coordinates: CoordinatesDto,
    paginationQuery: PaginationQueryDto,
    maxDistanceInKm: number,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  findParkingLotsInBounds(
    bounds: BoundingBoxDto,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: ParkingLotResponseDto[]; pagination: PaginationDto }>

  findAllForOperator(operatorId: string): Promise<ParkingLotResponseDto[]>

  // =================================================================
  // == Initial Creation Workflow (Giữ nguyên)
  // =================================================================

  createCreateRequest(
    createDto: CreateParkingLotDto,
  ): Promise<ParkingLotRequestResponseDto>

  // =================================================================
  // == Update/Delete Request Workflow (for Parking Lot Owner) - (SỬA ĐỔI)
  // =================================================================

  createUpdateRequest(
    parkingLotId: ParkingLotIdDto,
    updateRequestDto: CreateParkingLotUpdateRequestDto,
    userId: string,
    operatorId: string,
  ): Promise<ParkingLotRequestResponseDto>

  createDeleteRequest(
    parkingLotId: ParkingLotIdDto,
    deleteRequestDto: CreateParkingLotDeleteRequestDto,
    userId: string,
    operatorId: string,
  ): Promise<ParkingLotRequestResponseDto>

  // =================================================================
  // == Admin Review Workflow - (SỬA ĐỔI)
  // =================================================================

  reviewRequest(
    requestId: IdDto,
    reviewDto: ReviewRequestDto,
    adminId: string,
  ): Promise<{ data: boolean; message: string; responseCode: number }>

  // =================================================================
  // == Data Retrieval for History & Requests - (SỬA ĐỔI)
  // =================================================================

  /**
   * Lấy danh sách CÁC YÊU CẦU (pending, approved, etc.) của một bãi xe.
   */
  getRequestsForParkingLot(
    parkingLotId: ParkingLotIdDto,
  ): Promise<ParkingLotRequestResponseDto[]>

  /**
   * Lấy LỊCH SỬ THAY ĐỔI ĐÃ ÁP DỤNG của một bãi xe.
   */
  getHistoryForParkingLot(
    parkingLotId: ParkingLotIdDto,
  ): Promise<ParkingLotHistoryLogResponseDto[]>

  // =================================================================
  // == System/CRON Job Workflow - (MỚI)
  // =================================================================

  /**
   * Tìm và xử lý các yêu cầu đã được duyệt và đến hạn.
   * Hàm này sẽ được gọi bởi CRON job.
   */
  processApprovedRequests(): Promise<{ processed: number; failed: number }>

  // =================================================================
  // == Other Utilities
  // =================================================================

  updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<boolean>

  getAllRequest(
    status: string,
    type: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    data: ParkingLotRequestResponseDto[]
    pagination: PaginationDto
  }>

  hardDeleteRequestById(id: string): Promise<boolean>

  validateParkingKey(parkingId: string, secretKey: string): Promise<boolean>

  findRequestsByOperatorId(
    operatorId: string,
    status: string,
    type: string,
  ): Promise<ParkingLotRequestResponseDto[]>

  findParkingLotRequestById(id: string): Promise<ParkingLotRequestResponseDto>
}

export const IParkingLotService = Symbol('IParkingLotService')
