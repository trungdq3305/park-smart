import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import geohash from 'ngeohash'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { IAddressRepository } from '../address/interfaces/iaddress.repository'
import { Address } from '../address/schemas/address.schema'
import { IParkingLotStatusRepository } from '../parkingLotStatus/interfaces/iparkingLotStatus.repository'
import {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDto,
  ParkingLotResponseDto,
  ParkingLotSpotsUpdateDto,
} from './dto/parkingLot.dto'
import { UpdateParkingLotHistoryLogDto } from './dto/parkingLot.dto'
import { IParkingLotRepository } from './interfaces/iparkinglot.repository'
import { IParkingLotService } from './interfaces/iparkingLot.service'
import { IParkingLotHistoryLogRepository } from './interfaces/iparkingLotHistoryLog.repository'
import { ParkingLotGateway } from './parkingLot.gateway'
import { ParkingLot } from './schemas/parkingLot.schema'
import { ParkingLotHistoryLog } from './schemas/parkingLotHistoryLog.schema'
@Injectable()
export class ParkingLotService implements IParkingLotService {
  constructor(
    @Inject(IParkingLotRepository)
    private readonly parkingLotRepository: IParkingLotRepository,
    @Inject(IParkingLotHistoryLogRepository)
    private readonly parkingLotHistoryLogRepository: IParkingLotHistoryLogRepository,
    @Inject(IParkingLotStatusRepository)
    private readonly parkingLotStatusRepository: IParkingLotStatusRepository,
    @Inject(IAddressRepository)
    private readonly addressRepository: IAddressRepository,
    private readonly parkingLotGateway: ParkingLotGateway,
  ) {}

  private returnParkingLotResponseDto(
    parkingLot: ParkingLot,
  ): ParkingLotResponseDto {
    return plainToInstance(ParkingLotResponseDto, parkingLot, {
      excludeExtraneousValues: true,
    })
  }

  private determineRoomForParkingLot(address: Address): string {
    // Lấy kinh độ và vĩ độ từ document Address
    const longitude = address.location.coordinates[0]
    const latitude = address.location.coordinates[1]

    // Mã hóa tọa độ thành chuỗi geohash với độ chính xác là 7
    const roomName = geohash.encode(latitude, longitude, 7)

    return `room_${roomName}`
  }

  async getParkingLotDetails(id: IdDto): Promise<ParkingLotResponseDto> {
    const parkingLot = await this.parkingLotRepository.findParkingLotById(id.id)
    if (!parkingLot) {
      throw new Error('Không tìm thấy bãi đỗ xe')
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
    const parkingLotStatus =
      await this.parkingLotStatusRepository.findParkingLotStatusByStatus(
        'Đã áp dụng',
      )
    if (!parkingLotStatus) {
      throw new InternalServerErrorException(
        'Không tìm thấy trạng thái bãi đỗ xe hợp lệ',
      )
    }
    const data = await this.parkingLotRepository.findByCoordinates(
      coordinates.longitude,
      coordinates.latitude,
      paginationQuery.page,
      paginationQuery.pageSize,
      maxDistanceInKm,
      parkingLotStatus,
    )

    if (data.data.length === 0) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe nào')
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

    const parkingLotStatus =
      await this.parkingLotStatusRepository.findParkingLotStatusByStatus(
        'Đã áp dụng',
      )
    if (!parkingLotStatus) {
      throw new InternalServerErrorException(
        'Không tìm thấy trạng thái bãi đỗ xe hợp lệ',
      )
    }
    const data = await this.parkingLotRepository.findInBounds(
      bottomLeft,
      topRight,
      paginationQuery.page,
      paginationQuery.pageSize,
      parkingLotStatus,
    )

    if (data.data.length === 0) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe nào')
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

  async getUpdateHistoryLogForParkingLot(
    parkingLotId: IdDto,
  ): Promise<ParkingLotHistoryLog[]> {
    const historyLogs =
      await this.parkingLotHistoryLogRepository.findByParkingLotId(
        parkingLotId.id,
      )
    if (historyLogs === null || historyLogs.length === 0) {
      throw new NotFoundException('Không tìm thấy lịch sử cập nhật nào')
    }
    return historyLogs
  }

  async createParkingLot(
    createDto: CreateParkingLotDto,
    userId: string,
    currentIdOfUserRole: string,
  ): Promise<ParkingLotResponseDto> {
    const isAddressExist = await this.addressRepository.findAddressById(
      createDto.addressId,
    )
    if (!isAddressExist) {
      throw new NotFoundException('Địa chỉ chưa được tạo')
    }
    const parkingStatus =
      await this.parkingLotStatusRepository.findParkingLotStatusByStatus(
        'Chờ duyệt',
      )
    if (!parkingStatus) {
      throw new InternalServerErrorException(
        'Trạng thái bãi đỗ xe không hợp lệ',
      )
    }
    const dataSend = {
      ...createDto,
      addressId: createDto.addressId,
      createdBy: userId,
      createdAt: new Date(),
      // Initially, available spots equal total capacity
      parkingLotStatusId: parkingStatus,
      availableSpots: createDto.totalCapacityEachLevel * createDto.totalLevel,
      parkingLotOperatorId: currentIdOfUserRole,
    }
    const data = await this.parkingLotRepository.createParkingLot(dataSend)
    if (!data) {
      await this.addressRepository.deleteAddressPermanently(createDto.addressId)
      throw new InternalServerErrorException(
        'Tạo bãi đỗ xe thất bại do lỗi hệ thống',
      )
    }
    await this.addressRepository.setAddressAsUsed(createDto.addressId)
    return this.returnParkingLotResponseDto(data)
  }

  async requestParkingLotUpdate(
    parkingLotId: IdDto,
    updateRequestDto: UpdateParkingLotHistoryLogDto,
    userId: string,
  ): Promise<ParkingLotHistoryLog> {
    const parkingStatus =
      await this.parkingLotStatusRepository.findParkingLotStatusByStatus(
        'Chờ duyệt',
      )
    if (!parkingStatus) {
      throw new InternalServerErrorException(
        'Trạng thái bãi đỗ xe không hợp lệ',
      )
    }
    const dataSend = {
      ...updateRequestDto,
      parkingLotId: parkingLotId.id,
      createdBy: userId,
      createdAt: new Date(),
      parkingLotStatusId: parkingStatus,
    }
    const data =
      await this.parkingLotHistoryLogRepository.updateParkingLot(dataSend)
    return data
  }

  async approveNewParkingLot(
    parkingLotId: IdDto,
    statusId: IdDto,
    userId: string,
  ): Promise<ParkingLot> {
    const existingParkingLot =
      await this.parkingLotRepository.findParkingLotById(parkingLotId.id)
    if (!existingParkingLot) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe')
    }
    const result = await this.parkingLotRepository.approveParkingLot(
      parkingLotId.id,
      statusId.id,
      userId,
    )
    if (!result) {
      throw new InternalServerErrorException(
        'Phê duyệt bãi đỗ xe thất bại do lỗi hệ thống',
      )
    }
    return result
  }

  async updateAvailableSpotsForWebsocket(
    parkingLotId: string,
    change: number,
  ): Promise<ParkingLot> {
    // 1. Cập nhật DB và lấy về document mới (chỉ 1 lần gọi)
    const updatedParkingLot =
      await this.parkingLotRepository.updateAvailableSpots(parkingLotId, change)

    if (!updatedParkingLot) {
      throw new ConflictException('Bãi đỗ xe đã hết chỗ hoặc không tồn tại.')
    }

    // 2. LẤY THÔNG TIN ADDRESS ĐỂ XÁC ĐỊNH VỊ TRÍ
    const address = await this.addressRepository.findAddressById(
      updatedParkingLot.addressId,
    )

    // Nếu không có address thì không thể xác định room, có thể bỏ qua hoặc báo lỗi
    if (!address) {
      console.error(`Không tìm thấy Address cho ParkingLot ID: ${parkingLotId}`)
      return updatedParkingLot
    }

    // 3. Xác định roomName từ tọa độ của Address
    const roomName = this.determineRoomForParkingLot(address)

    // 4. Chuẩn bị payload nhỏ gọn để gửi đi
    const payload: ParkingLotSpotsUpdateDto = {
      _id: updatedParkingLot._id,
      availableSpots: updatedParkingLot.availableSpots,
    }

    // 5. Ra lệnh cho Gateway phát sóng vào đúng room
    this.parkingLotGateway.sendSpotsUpdate(roomName, payload)

    return updatedParkingLot
  }

  async deleteParkingLot(id: IdDto, userId: string): Promise<boolean> {
    const existingParkingLot =
      await this.parkingLotRepository.findParkingLotById(id.id)
    if (!existingParkingLot) {
      throw new NotFoundException('Không tìm thấy bãi đỗ xe')
    }
    const deleteStatus =
      await this.parkingLotStatusRepository.findParkingLotStatusByStatus(
        'Chờ duyệt xóa',
      )
    if (!deleteStatus) {
      throw new InternalServerErrorException(
        'Trạng thái bãi đỗ xe không tồn tại',
      )
    }
    try {
      const result = await this.parkingLotHistoryLogRepository.deleteParkingLot(
        id.id,
        userId,
        deleteStatus,
      )
      if (!result) {
        throw new InternalServerErrorException(
          'Xóa bãi đỗ xe thất bại do lỗi hệ thống',
        )
      }
      return result
    } catch {
      throw new InternalServerErrorException(
        'Xóa bãi đỗ xe thất bại do lỗi hệ thống',
      )
    }
  }
}
