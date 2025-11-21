import type { Basis } from './Basis'
import type { PackageRate } from './PackageRate'
import type { TieredRateSet } from './TiredRateSet'

export interface PricingPolicy {
  _id: string
  name: string
  pricePerHour: number
  fixedPrice: number
  basisId: Basis
  tieredRateSetId?: TieredRateSet | null
  packageRateId?: PackageRate | null
  priority: number
  startDate: string
}
