import type { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import type { IdDto } from 'src/common/dto/params.dto'

import type {
  CreateVehicleDto,
  PlateParamDto as PlateParameterDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from '../dto/vehicle.dto'
export interface IVehicleService {
  createVehicle(
    vehicle: CreateVehicleDto,
    userId: string,
    driverId: string,
  ): Promise<VehicleResponseDto>
  adminFindAllVehicles(
    page: number,
    pageSize: number,
  ): Promise<{ data: VehicleResponseDto[]; pagination: PaginationDto }>
  findAllVehicles(
    driverId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: VehicleResponseDto[]; pagination: PaginationDto }>
  findVehicleById(id: IdDto): Promise<VehicleResponseDto>
  findVehicleByPlateNumber(
    plateDto: PlateParameterDto,
  ): Promise<VehicleResponseDto>
  updateVehicle(
    id: IdDto,
    vehicle: UpdateVehicleDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }>
  deleteVehicle(
    id: IdDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }>
  restoreVehicle(
    id: IdDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }>
}

export const IVehicleService = Symbol('IVehicleService')
