import React from 'react'
import type { PromotionFilter } from './promotionTypes'
import './PromotionFilters.css'

interface PromotionFiltersProps {
  filter: PromotionFilter
  onFilterChange: (filter: PromotionFilter) => void
  totalCount: number
  filteredCount: number
}

const PromotionFilters: React.FC<PromotionFiltersProps> = ({
  filter,
  onFilterChange,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="promotion-controls-card">
      <div className="promotion-filter-wrapper">
        <label htmlFor="status-filter" className="promotion-filter-label">
          Lọc theo trạng thái:
        </label>
        <select
          id="status-filter"
          className="promotion-filter-select"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as PromotionFilter)}
        >
          <option value="all">-- Tất cả --</option>
          <option value="active">Đang hoạt động</option>
          <option value="upcoming">Sắp diễn ra</option>
          <option value="ended">Đã kết thúc</option>
          <option value="exhausted">Đã hết lượt</option>
          <option value="inactive">Đã vô hiệu</option>
        </select>
      </div>
      <div className="promotion-counter">
        Đang hiển thị <strong>{filteredCount}</strong> / {totalCount} khuyến mãi
      </div>
    </div>
  )
}

export default PromotionFilters
