import { ParkingLot } from '../schemas/parkingLot.schema'
import { CreateParkingLotDto } from '../dto/parkingLot.dto'

export interface IParkingLotRepository {
  createParkingLot(
    parkingLot: CreateParkingLotDto,
    userId: string,
  ): Promise<ParkingLot>

  findParkingLotById(id: string): Promise<ParkingLot | null>

  findByAddressIds(addressIds: string[]): Promise<ParkingLot[]>

  findAllParkingLot(
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLot[]; total: number }>

  deleteParkingLot(id: string, userId: string): Promise<boolean>

  updateAvalableSpots(id: string, availableSpots: number): Promise<boolean>

  approveParkingLot(
    id: string,
    isApproved: boolean,
    userId: string,
  ): Promise<ParkingLot | null>

  findByCoordinates(
    longitude: number,
    latitude: number,
    maxDistanceInKm: number,
  ): Promise<ParkingLot[]>

  findInBounds(
    bottomLeft: [number, number], // [lng, lat]
    topRight: [number, number], // [lng, lat]
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLot[]; total: number }>
}
