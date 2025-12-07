import React from 'react'
import type { Promotion } from '../../types/Promotion'
import PromotionItem from './PromotionItem'
import './PromotionItem.css'

interface PromotionListProps {
  promotions: Promotion[]
  onEdit?: (promotion: Promotion) => void
}

const PromotionList: React.FC<PromotionListProps> = ({ promotions, onEdit }) => {
  return (
    <div className="promotion-list">
      {promotions.map((promotion) => (
        <PromotionItem key={promotion._id} promotion={promotion} onEdit={onEdit} />
      ))}
    </div>
  )
}

export default PromotionList
