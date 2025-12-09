import type { ParkingLot } from './ParkingLot'

export interface ParkingLotSession {
  _id: string
  parkingLotId: ParkingLot
  reservationId?: Reservation | null
  subscriptionId?: Subscription | null
  plateNumber: string
  checkInTime: string
  checkOutTime?: string | null
  status: string
  paymentStatus: string
  amountPaid: number
  amountPayAfterCheckOut: number
  guestCardId?: GuestCard | null
  createdAt: string
  updatedAt?: string | null
}
export interface GuestCard {
  _id: string
  nfcUid: string
  code: string
}
export interface Reservation {
  _id: string
  reservationIdentifier: string
}
export interface Subscription {
  _id: string
  subscriptionIdentifier: string
}
