import type { ClientSession } from 'mongoose'

import type { ParkingLot } from '../schemas/parkingLot.schema'

export interface IParkingLotRepository {
  createParkingLot(
    parkingLotData: Partial<ParkingLot>,
  ): Promise<ParkingLot | null>

  findParkingLotById(id: string): Promise<ParkingLot | null>

  findByAddressIds(addressIds: string[]): Promise<ParkingLot[]>

  updateAvailableSpots(id: string, change: number): Promise<ParkingLot | null>

  approveParkingLot(
    id: string,
    statusId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<ParkingLot | null>

  findByCoordinates(
    longitude: number,
    latitude: number,
    page: number,
    pageSize: number,
    maxDistanceInKm: number,
    parkingLotStatus: string,
  ): Promise<{ data: ParkingLot[]; total: number }>

  findInBounds(
    bottomLeft: [number, number], // [lng, lat]
    topRight: [number, number], // [lng, lat]
    page: number,
    pageSize: number,
    parkingLotStatus: string,
  ): Promise<{ data: ParkingLot[]; total: number }>

  findAllParkingLotByStatus(
    page: number,
    pageSize: number,
    statusId: string,
  ): Promise<{ data: ParkingLot[]; total: number }>

  findAllForOperator(operatorId: string): Promise<ParkingLot[]>
}

export const IParkingLotRepository = Symbol('IParkingLotRepository')
