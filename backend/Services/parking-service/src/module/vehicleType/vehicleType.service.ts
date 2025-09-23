import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'

import { VehicleTypeResponseDto } from './dto/vehicleTypeResponse.dto'
import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'
import { IVehicleTypeService } from './interfaces/ivehicleType.service'
import { VehicleType } from './schemas/vehicleType.schema'

@Injectable()
export class VehicleTypeService implements IVehicleTypeService {
  constructor(
    @Inject(IVehicleTypeRepository)
    private vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  private returnVehicleTypeResponseDto(
    vehicleType: VehicleType,
  ): VehicleTypeResponseDto {
    return plainToInstance(VehicleTypeResponseDto, vehicleType, {
      excludeExtraneousValues: true,
    })
  }

  async getVehicleTypes(): Promise<VehicleTypeResponseDto[]> {
    // Sửa: Trả về entity
    const vehicleTypes = await this.vehicleTypeRepository.getVehicleTypes()
    if (vehicleTypes.length === 0) {
      throw new NotFoundException('Không tìm thấy loại xe nào trong hệ thống')
    }
    return vehicleTypes.map((vehicleType) =>
      this.returnVehicleTypeResponseDto(vehicleType),
    )
  }
}
