import React from 'react'
import type { Event } from '../../types/Event'
import { getEventStatus, formatDateRange } from './eventUtils'

interface EventsGridProps {
  events: Event[]
}

export const EventsGrid: React.FC<EventsGridProps> = ({ events }) => {
  const now = new Date()

  if (events.length === 0) {
    return (
      <div className="events-empty-state">
        <div className="events-empty-icon">📭</div>
        <h3 className="events-empty-title">Chưa có sự kiện phù hợp bộ lọc</h3>
        <p className="events-empty-text">
          Thử thay đổi bộ lọc hoặc tạo mới một sự kiện để thu hút người dùng tham gia và sử dụng
          dịch vụ Park Smart.
        </p>
      </div>
    )
  }

  return (
    <div className="events-grid">
      {events.map((event, index) => {
        const status = getEventStatus(event, now)
        const statusClass =
          status === 'running'
            ? 'event-status-running'
            : status === 'upcoming'
              ? 'event-status-upcoming'
              : 'event-status-ended'

        const statusLabel =
          status === 'running'
            ? 'Đang diễn ra'
            : status === 'upcoming'
              ? 'Sắp diễn ra'
              : 'Đã kết thúc'

        const imageUrl = `https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&dpr=1&sig=${index}`

        return (
          <article key={event._id} className="event-card">
            <div className="event-card-image-wrapper">
              <img src={imageUrl} alt={event.title} className="event-card-image" loading="lazy" />
              <div className="event-card-image-overlay" />

              <div className={`event-status-pill ${statusClass}`}>
                <span className="event-status-dot" />
                <span>{statusLabel}</span>
              </div>

              {event.includedPromotions && <div className="event-promo-pill">Ưu đãi kèm theo</div>}
            </div>

            <div className="event-card-content">
              <h3 className="event-title">{event.title}</h3>
              <p className="event-description">{event.description}</p>

              <div className="event-meta-row">
                <div className="event-meta-item">
                  <div className="event-meta-icon">⏰</div>
                  <span>{formatDateRange(event.startDate, event.endDate)}</span>
                </div>
                <div className="event-meta-item">
                  <div className="event-meta-icon">📍</div>
                  <span className="event-location-pill">
                    {event.location || 'Địa điểm chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>

            <div className="event-card-footer">
              <span>
                Tạo lúc:{' '}
                {new Date(event.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
              <span className="event-badge">#{event.parkingLotId?.slice(0, 6) || 'PARK'}</span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default EventsGrid
