import type { Promotion } from '../../types/Promotion'
import type { PromotionFilter, PromotionStatus } from './promotionTypes'

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatRuleValue = (ruleValue: string): string => {
  const numericValue = parseFloat(ruleValue)
  if (!isNaN(numericValue) && isFinite(numericValue)) {
    return `${numericValue.toLocaleString('vi-VN')} ₫`
  }
  return ruleValue
}

export const getDiscountText = (promotion: Promotion): string => {
  if (promotion.discountType === 'PERCENTAGE') {
    return `Giảm ${promotion.discountValue}%`
  }
  return `Giảm ${promotion.discountValue.toLocaleString()} đ`
}

export const getPromotionStatus = (promotion: Promotion): PromotionStatus => {
  const now = new Date()
  const startDate = new Date(promotion.startDate)
  const endDate = new Date(promotion.endDate)

  if (!promotion.isActive) {
    return { label: 'Đã vô hiệu', class: 'promotion-status-inactive' }
  }

  if (now < startDate) {
    return { label: 'Sắp diễn ra', class: 'promotion-status-upcoming' }
  }

  if (now >= startDate && now <= endDate) {
    if (promotion.currentUsageCount >= promotion.totalUsageLimit) {
      return { label: 'Đã hết lượt', class: 'promotion-status-exhausted' }
    }
    return { label: 'Đang hoạt động', class: 'promotion-status-active' }
  }

  return { label: 'Đã kết thúc', class: 'promotion-status-ended' }
}

export const getStatusLabel = (filter: PromotionFilter): string => {
  const statusMap: Record<string, string> = {
    all: 'Tất cả',
    active: 'Đang hoạt động',
    inactive: 'Đã vô hiệu',
    upcoming: 'Sắp diễn ra',
    ended: 'Đã kết thúc',
    exhausted: 'Đã hết lượt',
  }
  return statusMap[filter] || filter
}

