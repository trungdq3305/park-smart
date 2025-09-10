import { VehicleTypeResponseDto } from '../dto/vehicleTypeResponse.dto'
export interface IVehicleTypeRepository {
  getVehicleTypes(): Promise<VehicleTypeResponseDto[]>
}

export const IVehicleTypeRepository = Symbol('IVehicleTypeRepository')
