import { VehicleTypeResponseDto } from '../dto/vehicleTypeResponse.dto'

export interface IVehicleTypeService {
  getVehicleTypes(): Promise<VehicleTypeResponseDto[]> // Sửa: Trả về entity
}

export const IVehicleTypeService = Symbol('IVehicleTypeService')
