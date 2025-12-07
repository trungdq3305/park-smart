export interface Promotion 
{
    _id: string
    code: string
    name: string
    description: string | null
    discountType: string
    discountValue: number
    maxDiscountAmount: number | null
    startDate: string
    endDate: string
    totalUsageLimit: number
    currentUsageCount: number
    isActive: boolean
    createdAt: string
    updatedAt: string | null
    createdBy: string | null
    updatedBy: string | null
    eventId: string | null
    eventTitle: string | null
    rules: Rule[] | null
  }

  export interface Rule {
    _id: string
    promotionId: string
    ruleType: string
    ruleValue: string
  }