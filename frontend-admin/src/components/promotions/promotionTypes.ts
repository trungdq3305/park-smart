export type PromotionFilter = 'all' | 'active' | 'inactive' | 'upcoming' | 'ended' | 'exhausted'

export interface PromotionStats {
  total: number
  active: number
  inactive: number
  upcoming: number
  ended: number
  exhausted: number
}

export interface PromotionStatus {
  label: string
  class: string
}
