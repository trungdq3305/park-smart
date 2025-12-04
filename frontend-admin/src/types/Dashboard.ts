export interface DashboardResponse {
  parkingLotInfo: {
    name: string
    addressId: {
      wardId?: {
        wardName: string
      }
      fullAddress: string
    }
  }
  summary: DashboardSummary
  chartData: ChartDataPoint[]
}

export interface DashboardSummary {
  totalRevenue: number
  totalRefunded: number
  totalCheckIns: number
  totalReservations: number
  newSubscriptions: number
  revenueByWalkIn: number
  revenueByReservation: number
  revenueBySubscription: number
  refundBreakdown: RefundBreakdown
  revenueBreakdown: RevenueBreakdown
  totalCheckOuts: number
  avgParkingDurationMinutes: number
}

export interface ChartDataPoint {
  label: string
  revenue: number
  checkIns: number
}

export interface RevenueBreakdown {
  subscription: number
  reservation: number
  walkIn: number
}

export interface RefundBreakdown {
  subscription: number
  reservation: number
  walkIn: number
}
