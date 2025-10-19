import type { ClientSession } from 'mongoose'

import type { ParkingSpace } from '../schemas/parkingSpace.schema'

export interface ParkingSpaceCreationAttributes {
  parkingLotId: string
  parkingSpaceStatusId: string
  code: string
  level: number
  isElectricCar: boolean
}

export interface IParkingSpaceRepository {
  createMany(
    spaces: ParkingSpaceCreationAttributes[], // Định nghĩa kiểu dữ liệu chính xác hơn ở đây
    session?: ClientSession, // Thêm tham số session tùy chọn
  ): Promise<boolean>
  findByParkingLotId(
    parkingLotId: string,
    level: number,
  ): Promise<ParkingSpace[]>
  findById(id: string): Promise<ParkingSpace | null>
  updateStatus(
    id: string,
    parkingSpaceStatusId: string,
    session?: ClientSession, // Thêm tham số session tùy chọn
  ): Promise<any>
  deleteByParkingLotId(
    parkingLotId: string,
    session?: ClientSession, // Thêm tham số session tùy chọn
  ): Promise<void>
  findParkingLotOperatorIdBySpaceId(id: string): Promise<string | null>
}

export const IParkingSpaceRepository = Symbol('IParkingSpaceRepository')
