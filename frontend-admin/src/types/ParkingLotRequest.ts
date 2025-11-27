import type { ParkingLot } from "./ParkingLot"

export interface ParkingLotRequest {
  _id: string
  createdAt: string
  payload :ParkingLot
  effectiveDate: string
  requestType: string
  status: string
}