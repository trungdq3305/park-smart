import React from 'react'
import type { FAQ } from '../../types/FAQs'
import { formatDateTime, getStatusLabel, getStatusClass } from './faqUtils'
import FAQAnswerDropdown from './FAQAnswerDropdown'

interface FAQItemProps {
  faq: FAQ
}

export const FAQItem: React.FC<FAQItemProps> = ({ faq }) => {
  const statusClass = getStatusClass(faq.creatorRole)
  const statusLabel = getStatusLabel(faq.creatorRole)

  return (
    <div className="faq-item">
      <div className="faq-item-header">
        <div className="faq-item-title-section">
          <h3 className="faq-item-title">{faq.question}</h3>
          <div className={`faq-status-badge ${statusClass}`}>
            <span className="faq-status-dot" />
            <span>{statusLabel}</span>
          </div>
        </div>
        <div className="faq-date-range">
          <div className="faq-date-range-label">Tạo lúc</div>
          <div className="faq-date-range-value">{formatDateTime(faq.createdAt)}</div>
        </div>
      </div>

      <div className="faq-item-body">
        <div className="faq-details-grid">
          <div className="faq-detail-item">
            <div className="faq-detail-icon">👤</div>
            <div className="faq-detail-content">
              <span className="faq-detail-label">Người tạo</span>
              <span className="faq-detail-value">{faq.creatorName || 'Không rõ'}</span>
            </div>
          </div>

          <div className="faq-detail-item">
            <div className="faq-detail-icon">🔑</div>
            <div className="faq-detail-content">
              <span className="faq-detail-label">Vai trò</span>
              <span className="faq-detail-value">{faq.creatorRole || 'Không rõ'}</span>
            </div>
          </div>

          <div className="faq-detail-item">
            <div className="faq-detail-icon">🆔</div>
            <div className="faq-detail-content">
              <span className="faq-detail-label">ID FAQ</span>
              <span className="faq-detail-value">{faq._id.slice(-12)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="faq-item-footer">
        <div className="faq-date-info">
          <div className="faq-date-item">
            <span className="faq-date-label">Tạo lúc:</span>
            <span className="faq-date-value">{formatDateTime(faq.createdAt)}</span>
          </div>
          {faq.updatedAt && (
            <div className="faq-date-item">
              <span className="faq-date-label">Cập nhật:</span>
              <span className="faq-date-value">{formatDateTime(faq.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <FAQAnswerDropdown answer={faq.answer} />
    </div>
  )
}

export default FAQItem
