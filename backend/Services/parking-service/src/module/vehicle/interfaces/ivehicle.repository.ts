import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto'
import { Vehicle } from '../schemas/vehicle.schema'
export interface IVehicleRepository {
  createVehicle(
    vehicle: CreateVehicleDto,
    userId: string,
    driverId: string,
  ): Promise<Vehicle>
  createVehicleIfDeleted(
    vehicle: CreateVehicleDto,
    userId: string,
    driverId: string,
  ): Promise<Vehicle | null>
  adminFindAllVehicles(
    page: number,
    pageSize: number,
  ): Promise<{ data: Vehicle[]; total: number }>
  findAllVehicles(
    driverId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Vehicle[]; total: number }>
  findVehicleById(id: string): Promise<Vehicle | null>
  findVehicleByPlateNumber(plateNumber: string): Promise<Vehicle | null>
  updateVehicle(
    id: string,
    vehicle: UpdateVehicleDto,
    userId: string,
  ): Promise<boolean>
  deleteVehicle(id: string, userId: string): Promise<boolean>
  restoreVehicle(id: string, userId: string): Promise<boolean>
}

export const IVehicleRepository = Symbol('IVehicleRepository')
