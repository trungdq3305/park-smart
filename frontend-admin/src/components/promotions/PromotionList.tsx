import React from 'react'
import type { Promotion } from '../../types/Promotion'
import PromotionItem from './PromotionItem'
import './PromotionItem.css'

interface PromotionListProps {
  promotions: Promotion[]
  onEdit?: (promotion: Promotion) => void
  onDelete?: (promotionId: string, promotionName: string) => void
}

const PromotionList: React.FC<PromotionListProps> = ({ promotions, onEdit, onDelete }) => {
  return (
    <div className="promotion-list">
      {promotions.map((promotion) => (
        <PromotionItem
          key={promotion._id}
          promotion={promotion}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default PromotionList
