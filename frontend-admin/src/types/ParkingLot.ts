import type { Address } from './Address'

export interface ParkingLot {
  _id: string
  addressId: Address
  name: string
  totalCapacityEachLevel: number
  totalLevel: number
  availableSpots: number
  parkingLotOperatorId: string
  parkingLotStatus: string
  bookableCapacity: number
  leasedCapacity: number
  walkInCapacity: number
  bookingSlotDurationHours: number
}
