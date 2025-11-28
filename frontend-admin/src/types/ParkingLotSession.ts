import type { ParkingLot } from "./ParkingLot"

export interface ParkingLotSession{
    _id: string
    parkingLotId: ParkingLot
    reservationId?: string | null
    subscriptionId?: string | null
    plateNumber : string
    checkInTime: string
    checkOutTime?: string | null
    status : string
    paymentStatus : string
    amountPaid: number
    amountPayAfterCheckOut: number
    createdAt : string
    updatedAt? : string | null
}