import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { VehicleTypeResponseDto } from '../dto/vehicleTypeResponse.dto'

export interface IVehicleTypeService {
  getVehicleTypes(): Promise<ApiResponseDto<VehicleTypeResponseDto>>
}

export const IVehicleTypeService = Symbol('IVehicleTypeService')
