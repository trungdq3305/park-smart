import React from 'react'
import type { FAQ } from '../../types/FAQs'
import type { FAQFilter } from './faqTypes'
import { getFilterLabel } from './faqUtils'
import FAQItem from './FAQItem'

interface FAQListProps {
  faqs: FAQ[]
  filter: FAQFilter
  onEdit?: (faq: FAQ) => void
}

export const FAQList: React.FC<FAQListProps> = ({ faqs, filter, onEdit }) => {
  if (faqs.length === 0) {
    return (
      <div className="faq-empty-state">
        <div className="faq-empty-icon">📭</div>
        <h3 className="faq-empty-title">Chưa có FAQs nào</h3>
        <p className="faq-empty-text">
          {filter === 'all'
            ? 'Chưa có FAQs nào trong hệ thống.'
            : `Không có FAQs với bộ lọc "${getFilterLabel(filter)}".`}
        </p>
      </div>
    )
  }

  return (
    <div className="faq-list">
      {faqs.map((faq) => (
        <FAQItem key={faq._id} faq={faq} onEdit={onEdit} />
      ))}
    </div>
  )
}

export default FAQList
