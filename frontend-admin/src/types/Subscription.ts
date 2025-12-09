export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  monthlyFeeAmount: number
  billingDayOfMonth: number
  gracePeriodDays: number
  penaltyFeeAmount: number
  maxOverdueMonthsBeforeSuspension: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}