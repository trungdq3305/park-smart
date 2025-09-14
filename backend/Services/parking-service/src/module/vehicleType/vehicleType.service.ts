import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'
import { IVehicleTypeService } from './interfaces/ivehicleType.service'
import { VehicleType } from './schemas/vehicleType.schema'
import { plainToInstance } from 'class-transformer'
import { VehicleTypeResponseDto } from './dto/vehicleTypeResponse.dto'

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
    if (!vehicleTypes || vehicleTypes.length === 0) {
      throw new NotFoundException('Không tìm thấy loại xe nào')
    }
    return vehicleTypes.map((vehicleType) =>
      this.returnVehicleTypeResponseDto(vehicleType),
    )
  }
}
