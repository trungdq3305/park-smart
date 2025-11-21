export interface TieredRateSet {
  _id: string
  name: string
  tiers: Tier[]
}

export interface Tier {
  fromHour: string
  toHour: string
  price: number
}