import type { PricingPolicy } from './PricingPolicy'

export interface PricingPolicyLink {
  _id: string
  parkingLotId: { _id: string }
  pricingPolicyId: PricingPolicy
  priority: number
  startDate: string
  createdAt: string
  updatedAt: string | null
  endDate?: string | null
}
