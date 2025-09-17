import { IdDto } from 'src/common/dto/params.dto'
import {
  CreateVehicleDto,
  PlateParamDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from '../dto/vehicle.dto'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
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
  findVehicleByPlateNumber(plateDto: PlateParamDto): Promise<VehicleResponseDto>
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
