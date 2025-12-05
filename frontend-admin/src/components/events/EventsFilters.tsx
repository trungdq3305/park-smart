import React from 'react'
import type { EventFilter } from './eventTypes'

interface EventsFiltersProps {
  filter: EventFilter
  onChange: (filter: EventFilter) => void
  total: number
  running: number
  upcoming: number
  ended: number
  withPromo: number
  filteredCount: number
}

export const EventsFilters: React.FC<EventsFiltersProps> = ({
  filter,
  onChange,
  total,
  running,
  upcoming,
  ended,
  withPromo,
  filteredCount,
}) => {
  return (
    <div className="events-controls-card">
      <div className="events-filters">
        <button
          type="button"
          className={`events-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => onChange('all')}
        >
          Tất cả
          <span className="badge">{total}</span>
        </button>
        <button
          type="button"
          className={`events-filter-btn ${filter === 'running' ? 'active' : ''}`}
          onClick={() => onChange('running')}
        >
          Đang diễn ra
          <span className="badge">{running}</span>
        </button>
        <button
          type="button"
          className={`events-filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => onChange('upcoming')}
        >
          Sắp diễn ra
          <span className="badge">{upcoming}</span>
        </button>
        <button
          type="button"
          className={`events-filter-btn ${filter === 'ended' ? 'active' : ''}`}
          onClick={() => onChange('ended')}
        >
          Đã kết thúc
          <span className="badge">{ended}</span>
        </button>
        <button
          type="button"
          className={`events-filter-btn ${filter === 'promo' ? 'active' : ''}`}
          onClick={() => onChange('promo')}
        >
          Có khuyến mãi
          <span className="badge">{withPromo}</span>
        </button>
      </div>
      <div className="events-counter">
        Đang hiển thị <strong>{filteredCount}</strong> / {total} sự kiện
      </div>
    </div>
  )
}

export default EventsFilters
