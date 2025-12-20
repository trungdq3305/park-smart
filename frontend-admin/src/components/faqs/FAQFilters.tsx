import React from 'react'
import type { FAQFilter } from './faqTypes'
import { getFilterLabel } from './faqUtils'

interface FAQFiltersProps {
  filter: FAQFilter
  onChange: (filter: FAQFilter) => void
  total: number
  admin: number
  operator: number
  filteredCount: number
}

export const FAQFilters: React.FC<FAQFiltersProps> = ({
  filter,
  onChange,
  total,
  admin,
  operator,
  filteredCount,
}) => {
  return (
    <div className="faq-controls-card">
      <div className="faq-filter-wrapper">
        <label htmlFor="faq-filter" className="faq-filter-label">
          Lọc theo nguồn tạo:
        </label>
        <select
          id="faq-filter"
          className="faq-filter-select"
          value={filter}
          onChange={(e) => onChange(e.target.value as FAQFilter)}
        >
          <option value="all">-- Tất cả --</option>
          <option value="Admin">Admin</option>
          <option value="Operator">Operator</option>
        </select>
      </div>
      <div className="faq-counter">
        Đang hiển thị <strong>{filteredCount}</strong> / {total} FAQs ({getFilterLabel(filter)})
      </div>
    </div>
  )
}

export default FAQFilters

