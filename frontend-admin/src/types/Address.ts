import type { Ward } from "./Ward"

export interface Address {
  _id: string
  latitude: number
  longitude: number
  fullAddress: string
  wardId: Ward
}