import { ParkingLot } from '../schemas/parkingLot.schema'

export interface IParkingLotRepository {
  createParkingLot(parkingLot: ParkingLot): Promise<ParkingLot>
  findParkingLotById(id: string): Promise<ParkingLot | null>
  findByAddressIds(addressIds: string[]): Promise<ParkingLot[]>
  findAllParkingLot(
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLot[]; total: number }>
  deleteParkingLot(id: string): Promise<boolean>
  updateAvalableSpots(
    id: string,
    availableSpots: number,
  ): Promise<ParkingLot | null>
  approveParkingLot(id: string, isApproved: boolean): Promise<ParkingLot | null>
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
