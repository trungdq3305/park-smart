import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { IBrandRepository } from '../brand/interfaces/ibrand.repository'
import { IColorRepository } from '../color/interfaces/icolor.repository'
import { IVehicleTypeRepository } from '../vehicleType/interfaces/ivehicleType.repository'
import {
  CreateVehicleDto,
  PlateParamDto as PlateParameterDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from './dto/vehicle.dto'
import { IVehicleRepository } from './interfaces/ivehicle.repository'
import { IVehicleService } from './interfaces/ivehicle.service'
import { Vehicle } from './schemas/vehicle.schema'
@Injectable()
export class VehicleService implements IVehicleService {
  constructor(
    @Inject(IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
    @Inject(IColorRepository)
    private readonly colorRepository: IColorRepository,
    @Inject(IBrandRepository)
    private readonly brandRepository: IBrandRepository,
  ) {}

  private async checkVehicleOwnership(id: string, userId: string) {
    const existingVehicle = await this.vehicleRepository.findVehicleById(id)
    if (!existingVehicle) {
      throw new NotFoundException('Không tìm thấy xe')
    }
    if (existingVehicle.createdBy !== userId) {
      throw new ConflictException('Người dùng không có quyền cập nhật xe này')
    }
  }

  private returnVehicleResponseDto(vehicle: Vehicle): VehicleResponseDto {
    return plainToInstance(VehicleResponseDto, vehicle, {
      excludeExtraneousValues: true,
    })
  }

  private async checkCondtionToCreateVehicle(
    vehicleTypeId: string,
    colorId: string,
    brandId: string,
  ) {
    const vehicleType =
      await this.vehicleTypeRepository.findVehicleTypeById(vehicleTypeId)

    if (!vehicleType) {
      throw new NotFoundException(
        `Loại xe với ID "${vehicleTypeId}" không tồn tại. Vui lòng kiểm tra lại thông tin loại xe.`,
      )
    }

    const color = await this.colorRepository.findColorById(colorId)
    if (!color) {
      throw new NotFoundException(
        `Màu xe với ID "${colorId}" không tồn tại. Vui lòng kiểm tra lại thông tin màu xe.`,
      )
    }

    const brand = await this.brandRepository.findBrandById(brandId)
    if (!brand) {
      throw new NotFoundException(
        `Hãng xe với ID "${brandId}" không tồn tại. Vui lòng kiểm tra lại thông tin hãng xe.`,
      )
    }
  }

  async createVehicle(
    createVehicleDto: CreateVehicleDto,
    userId: string,
    driverId: string,
  ): Promise<VehicleResponseDto> {
    const existingVehicle =
      await this.vehicleRepository.findVehicleByPlateNumber(
        createVehicleDto.plateNumber,
      )
    if (existingVehicle && !existingVehicle.deletedAt) {
      throw new ConflictException(
        'Xe đã tồn tại và được sử dụng bởi người dùng khác',
      )
    }

    await this.checkCondtionToCreateVehicle(
      createVehicleDto.vehicleTypeId,
      createVehicleDto.colorId,
      createVehicleDto.brandId,
    )

    let vehicle: Vehicle | null

    if (existingVehicle?.deletedAt) {
      vehicle = await this.vehicleRepository.createVehicleIfDeleted(
        createVehicleDto,
        userId,
        driverId,
      )
    } else {
      vehicle = await this.vehicleRepository.createVehicle(
        createVehicleDto,
        userId,
        driverId,
      )
    }

    if (!vehicle) {
      throw new ConflictException('Tạo xe không thành công')
    }

    return this.returnVehicleResponseDto(vehicle)
  }

  async adminFindAllVehicles(
    page: number,
    pageSize: number,
  ): Promise<{ data: VehicleResponseDto[]; pagination: PaginationDto }> {
    const vehicles = await this.vehicleRepository.adminFindAllVehicles(
      page,
      pageSize,
    )

    if (vehicles.data.length === 0) {
      throw new NotFoundException('Không tìm thấy xe nào')
    }

    return {
      data: vehicles.data.map((vehicle) =>
        this.returnVehicleResponseDto(vehicle),
      ),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: vehicles.total,
        totalPages: Math.ceil(vehicles.total / pageSize),
      },
    }
  }

  async findAllVehicles(
    driverId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: VehicleResponseDto[]; pagination: PaginationDto }> {
    const vehicles = await this.vehicleRepository.findAllVehicles(
      driverId,
      page,
      pageSize,
    )

    if (vehicles.data.length === 0) {
      throw new NotFoundException('Không tìm thấy xe nào')
    }

    return {
      data: vehicles.data.map((vehicle) =>
        this.returnVehicleResponseDto(vehicle),
      ),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: vehicles.total,
        totalPages: Math.ceil(vehicles.total / pageSize),
      },
    }
  }

  async findVehicleById(id: IdDto): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findVehicleById(id.id)
    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe')
    }
    return this.returnVehicleResponseDto(vehicle)
  }

  async findVehicleByPlateNumber(
    plateDto: PlateParameterDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findVehicleByPlateNumber(
      plateDto.plateNumber,
    )
    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe')
    }
    return this.returnVehicleResponseDto(vehicle)
  }

  async updateVehicle(
    id: IdDto,
    vehicle: UpdateVehicleDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.checkVehicleOwnership(id.id, userId)
    const updatedVehicle = await this.vehicleRepository.updateVehicle(
      id.id,
      vehicle,
      userId,
    )

    await this.checkCondtionToCreateVehicle(
      vehicle.vehicleTypeId,
      vehicle.colorId,
      vehicle.brandId,
    )

    let message: string
    let success: boolean
    if (!updatedVehicle) {
      message =
        'Cập nhật xe không thành công do xe đã bị xóa hoặc không có gì thay đổi'
      success = false
    } else {
      message = 'Cập nhật xe thành công'
      success = true
    }

    return { success, message }
  }

  async deleteVehicle(
    id: IdDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.checkVehicleOwnership(id.id, userId)
    const deletedVehicle = await this.vehicleRepository.deleteVehicle(
      id.id,
      userId,
    )
    let message: string
    if (!deletedVehicle) {
      message = 'Xóa xe không thành công do xe đã bị xóa'
    } else {
      message = 'Xóa xe thành công'
    }
    return {
      success: deletedVehicle,
      message,
    }
  }

  async restoreVehicle(
    id: IdDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.checkVehicleOwnership(id.id, userId)
    const restoredVehicle = await this.vehicleRepository.restoreVehicle(
      id.id,
      userId,
    )
    let message: string
    if (!restoredVehicle) {
      message = 'Khôi phục xe không thành công do xe không bị xóa'
    } else {
      message = 'Khôi phục xe thành công'
    }
    return {
      success: restoredVehicle,
      message,
    }
  }
}
