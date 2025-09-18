import { ParkingLot } from '../schemas/parkingLot.schema'

export interface IParkingLotRepository {
  createParkingLot(parkingLot: ParkingLot): Promise<ParkingLot>
  findParkingLotById(id: string): Promise<ParkingLot | null>
  findByAddressIds(addressIds: string[]): Promise<ParkingLot[]>
  findAllParkingLot(): Promise<ParkingLot[]>
  deleteParkingLot(id: string): Promise<boolean>
}
