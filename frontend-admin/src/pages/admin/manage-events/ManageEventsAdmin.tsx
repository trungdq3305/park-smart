import React, { useMemo, useState } from 'react'
import { useGetEventsQuery } from '../../../features/admin/eventAPI'
import type { Event } from '../../../types/Event'
import { getEventStatus, formatDateRange } from '../../../components/events/eventUtils'
import type { EventFilter } from '../../../components/events/eventTypes'
import { EventPromotionsDropdown } from '../../../components/events'
import './ManageEventsAdmin.css'

interface EventsResponse {
  data: Event[]
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    running: 'Đang diễn ra',
    upcoming: 'Sắp tới',
    ended: 'Đã kết thúc',
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string): string => {
  if (status === 'running') return 'event-status-running'
  if (status === 'upcoming') return 'event-status-upcoming'
  if (status === 'ended') return 'event-status-ended'
  return 'event-status-pending'
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ManageEventsAdmin: React.FC = () => {
  const [filter, setFilter] = useState<EventFilter>('all')
  const { data, isLoading, error } = useGetEventsQuery({}) as {
    data?: EventsResponse
    isLoading: boolean
    error?: unknown
  }
  const events: Event[] = Array.isArray(data) ? data : (data as { data?: Event[] })?.data || []

  const now = useMemo(() => new Date(), [])

  const stats = useMemo(() => {
    const total = events.length
    let running = 0
    let upcoming = 0
    let ended = 0
    let withPromo = 0

    events.forEach((event) => {
      const status = getEventStatus(event, now)
      if (status === 'running') running += 1
      if (status === 'upcoming') upcoming += 1
      if (status === 'ended') ended += 1
      if (event.includedPromotions) withPromo += 1
    })

    return { total, running, upcoming, ended, withPromo }
  }, [events, now])

  const filteredEvents = useMemo(() => {
    if (filter === 'promo') {
      return events.filter((event) => event.includedPromotions)
    }
    if (filter === 'all') return events
    return events.filter((event) => getEventStatus(event, now) === filter)
  }, [events, filter, now])

  if (isLoading) {
    return (
      <div className="manage-events-admin-page">
        <div className="event-loading">
          <div className="event-loading-spinner" />
          <p>Đang tải danh sách sự kiện...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-events-admin-page">
        <div className="event-error">
          <span className="event-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách sự kiện. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-events-admin-page">
      <div className="event-page-header">
        <div>
          <h1>Quản lý sự kiện</h1>
          <p>Xem và theo dõi tất cả sự kiện trong hệ thống Park Smart</p>
        </div>
      </div>

      <div className="event-page-content">
        {/* Stats */}
        <div className="event-stats-section">
          <div className="event-stat-card">
            <div className="event-stat-icon total">📅</div>
            <div className="event-stat-content">
              <h3>{stats.total}</h3>
              <p>Tổng sự kiện</p>
              <div className="event-stat-sub">Tất cả sự kiện</div>
            </div>
          </div>
          <div className="event-stat-card">
            <div className="event-stat-icon running">🎉</div>
            <div className="event-stat-content">
              <h3>{stats.running}</h3>
              <p>Đang diễn ra</p>
              <div className="event-stat-sub">Sự kiện hiện tại</div>
            </div>
          </div>
          <div className="event-stat-card">
            <div className="event-stat-icon upcoming">⏰</div>
            <div className="event-stat-content">
              <h3>{stats.upcoming}</h3>
              <p>Sắp tới</p>
              <div className="event-stat-sub">Sự kiện sắp diễn ra</div>
            </div>
          </div>
          <div className="event-stat-card">
            <div className="event-stat-icon ended">✅</div>
            <div className="event-stat-content">
              <h3>{stats.ended}</h3>
              <p>Đã kết thúc</p>
              <div className="event-stat-sub">Sự kiện đã hoàn thành</div>
            </div>
          </div>
          <div className="event-stat-card">
            <div className="event-stat-icon promo">🎁</div>
            <div className="event-stat-content">
              <h3>{stats.withPromo}</h3>
              <p>Có khuyến mãi</p>
              <div className="event-stat-sub">Sự kiện có promotion</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="event-controls-card">
          <div className="event-filter-wrapper">
            <label htmlFor="status-filter" className="event-filter-label">
              Lọc theo trạng thái:
            </label>
            <select
              id="status-filter"
              className="event-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as EventFilter)}
            >
              <option value="all">-- Tất cả --</option>
              <option value="running">Đang diễn ra</option>
              <option value="upcoming">Sắp tới</option>
              <option value="ended">Đã kết thúc</option>
              <option value="promo">Có khuyến mãi</option>
            </select>
          </div>
          <div className="event-counter">
            Đang hiển thị <strong>{filteredEvents.length}</strong> / {stats.total} sự kiện
          </div>
        </div>

        {/* Event List */}
        {filteredEvents.length === 0 ? (
          <div className="event-empty-state">
            <div className="event-empty-icon">🎪</div>
            <h3 className="event-empty-title">Chưa có sự kiện nào</h3>
            <p className="event-empty-text">
              {filter === 'all'
                ? 'Chưa có sự kiện nào trong hệ thống.'
                : `Không có sự kiện với bộ lọc "${getStatusLabel(filter)}".`}
            </p>
          </div>
        ) : (
          <div className="event-list">
            {filteredEvents.map((event) => {
              const status = getEventStatus(event, now)
              const statusClass = getStatusClass(status)
              const statusLabel = getStatusLabel(status)

              return (
                <div key={event._id} className="event-item">
                  <div className="event-item-header">
                    <div className="event-item-title-section">
                      <h3 className="event-item-title">{event.title}</h3>
                      {event.includedPromotions && (
                        <div className="event-promo-badge">
                          <span>🎁</span>
                          <span>Khuyến mãi</span>
                        </div>
                      )}
                      <div className={`event-status-badge ${statusClass}`}>
                        <span className="event-status-dot" />
                        <span>{statusLabel}</span>
                      </div>
                    </div>
                    <div className="event-date-range">
                      <div className="event-date-range-label">Thời gian</div>
                      <div className="event-date-range-value">
                        {formatDateRange(event.startDate, event.endDate)}
                      </div>
                    </div>
                  </div>

                  <div className="event-item-body">
                    {event.description && (
                      <div className="event-description">
                        <p>{event.description}</p>
                      </div>
                    )}

                    <div className="event-details-grid">
                      <div className="event-detail-item">
                        <div className="event-detail-icon">📍</div>
                        <div className="event-detail-content">
                          <span className="event-detail-label">Địa điểm</span>
                          <span className="event-detail-value">{event.location || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="event-detail-item">
                        <div className="event-detail-icon">📅</div>
                        <div className="event-detail-content">
                          <span className="event-detail-label">Bắt đầu</span>
                          <span className="event-detail-value">
                            {formatDateTime(event.startDate)}
                          </span>
                        </div>
                      </div>

                      <div className="event-detail-item">
                        <div className="event-detail-icon">🏁</div>
                        <div className="event-detail-content">
                          <span className="event-detail-label">Kết thúc</span>
                          <span className="event-detail-value">
                            {formatDateTime(event.endDate)}
                          </span>
                        </div>
                      </div>

                      {event.parkingLotName && (
                        <div className="event-detail-item">
                          <div className="event-detail-icon">🏢</div>
                          <div className="event-detail-content">
                            <span className="event-detail-label">Bãi đỗ xe</span>
                            <span className="event-detail-value">{event.parkingLotName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="event-item-footer">
                    <div className="event-date-info">
                      <div className="event-date-item">
                        <span className="event-date-label">Tạo lúc:</span>
                        <span className="event-date-value">{formatDateTime(event.createdAt)}</span>
                      </div>
                      {event.updatedAt !== event.createdAt && (
                        <div className="event-date-item">
                          <span className="event-date-label">Cập nhật:</span>
                          <span className="event-date-value">
                            {formatDateTime(event.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {event.includedPromotions && <EventPromotionsDropdown eventId={event._id} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageEventsAdmin
