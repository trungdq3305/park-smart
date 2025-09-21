import { ParkingLot } from '../schemas/parkingLot.schema'

export interface IParkingLotRepository {
  createParkingLot(parkingLotData: Partial<ParkingLot>): Promise<ParkingLot>

  findParkingLotById(id: string): Promise<ParkingLot | null>

  findByAddressIds(addressIds: string[]): Promise<ParkingLot[]>

  updateAvailableSpots(id: string, change: number): Promise<boolean>

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

  findAllParkingLotByStatus(
    page: number,
    pageSize: number,
    statusId: string,
  ): Promise<{ data: ParkingLot[]; total: number }>
}
