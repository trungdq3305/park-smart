import type { ParkingLot } from "./ParkingLot";

export interface Dashboard {
    parkingLotInfo: ParkingLot
    summary : Summary
    revenueBreakdown : RevenueBreakdown
    refundBreakdown : RefundBreakdown
    totalCheckIns : number
    avgParkingDurationMinutes : number
    chartData : ChartDataPoint[]
}

export interface ChartDataPoint {
    label : string
    revenue : number
    checkIns : number
}

export interface Summary {
    totalRevenue : number
    totalCheckIns : number
    totalReservations : number
    newSubscriptions : number
    revenueByWalkIn : number
    revenueByReservation : number
    revenueBySubscription : number
    avgParkingDurationMinutes : number
}

export interface RevenueBreakdown {
    subscription : number
    reservation : number
    walkIn : number
}

export interface RefundBreakdown {
    subscription : number
    reservation : number
    walkIn : number
}