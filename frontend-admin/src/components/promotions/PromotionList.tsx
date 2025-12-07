import React from 'react'
import type { Promotion } from '../../types/Promotion'
import PromotionItem from './PromotionItem'
import './PromotionItem.css'

interface PromotionListProps {
  promotions: Promotion[]
}

const PromotionList: React.FC<PromotionListProps> = ({ promotions }) => {
  return (
    <div className="promotion-list">
      {promotions.map((promotion) => (
        <PromotionItem key={promotion._id} promotion={promotion} />
      ))}
    </div>
  )
}

export default PromotionList
