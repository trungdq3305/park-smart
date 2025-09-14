import { VehicleType } from '../schemas/vehicleType.schema'

export interface IVehicleTypeRepository {
  getVehicleTypes(): Promise<VehicleType[]> // Sửa: Trả về entity
  // Giả định bạn sẽ cần hàm này trong tương lai
  getVehicleTypeById(id: string): Promise<string | null>
}

export const IVehicleTypeRepository = Symbol('IVehicleTypeRepository')
