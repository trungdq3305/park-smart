import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'
import { IVehicleTypeService } from './interfaces/ivehicalType.service'
import { VehicleTypeResponseDto } from './dto/vehicleTypeResponse.dto'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'

@Injectable()
export class VehicleTypeService implements IVehicleTypeService {
  constructor(
    @Inject(IVehicleTypeRepository)
    private vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async getVehicleTypes(): Promise<ApiResponseDto<VehicleTypeResponseDto>> {
    const vehicleTypes = await this.vehicleTypeRepository.getVehicleTypes()
    if (!vehicleTypes || vehicleTypes.length === 0) {
      throw new NotFoundException('Không tìm thấy loại xe nào')
    }
    return new ApiResponseDto({
      data: vehicleTypes.map((type) => new VehicleTypeResponseDto(type)),
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách loại xe thành công',
      success: true,
    })
  }
}
