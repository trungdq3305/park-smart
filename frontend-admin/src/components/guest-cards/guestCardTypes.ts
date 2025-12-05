export type GuestCardFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'LOST' | 'DAMAGED' | 'LOCKED'

export interface GuestCardStats {
  active: number
  inactive: number
  lost: number
  damaged: number
  locked: number
}
