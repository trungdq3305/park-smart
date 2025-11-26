// src/features/operator/types/register.types.ts

export interface RegisterRequest {
  email: string
  password: string
  phoneNumber: string
  fullName: string
  paymentEmail: string
  bussinessName: string
  isAgreeToP: boolean
}

export interface AddressRequest {
  fullAddress: string
  wardId: string
  latitude: number | null
  longitude: number | null
}

export interface ParkingLotRequest {
  addressId?: string | null
  name: string
  totalCapacityEachLevel: number
  totalLevel: number
  effectiveDate: string | null
  bookableCapacity: number
  leasedCapacity: number
  walkInCapacity: number
  bookingSlotDurationHours: number
  parkingLotOperatorId?: string | null
  is24Hours: boolean
  openTime: string | null
  closeTime: string | null
  maxVehicleHeight: number
  maxVehicleWidth: number
  electricCarPercentage: number
}

export interface OperatorFullRegisterRequest {
  registerRequest: RegisterRequest
  addressRequest: AddressRequest
  parkingLotRequest: ParkingLotRequest
}
