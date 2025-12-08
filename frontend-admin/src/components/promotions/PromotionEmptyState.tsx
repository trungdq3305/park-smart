import React from 'react'
import type { PromotionFilter } from './promotionTypes'
import { getStatusLabel } from './promotionUtils'
import './PromotionEmptyState.css'

interface PromotionEmptyStateProps {
  filter: PromotionFilter
}

const PromotionEmptyState: React.FC<PromotionEmptyStateProps> = ({ filter }) => {
  return (
    <div className="promotion-empty-state">
      <div className="promotion-empty-icon">🎁</div>
      <h3 className="promotion-empty-title">Chưa có khuyến mãi nào</h3>
      <p className="promotion-empty-text">
        {filter === 'all'
          ? 'Chưa có chương trình khuyến mãi nào trong hệ thống.'
          : `Không có khuyến mãi với bộ lọc "${getStatusLabel(filter)}".`}
      </p>
    </div>
  )
}

export default PromotionEmptyState
