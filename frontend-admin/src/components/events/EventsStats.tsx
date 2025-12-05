import React from 'react'

interface EventsStatsProps {
  total: number
  running: number
  upcoming: number
  withPromo: number
}

export const EventsStats: React.FC<EventsStatsProps> = ({
  total,
  running,
  upcoming,
  withPromo,
}) => {
  return (
    <div className="events-stats-section">
      <div className="events-stat-card">
        <div className="events-stat-icon total">🎉</div>
        <div className="events-stat-content">
          <h3>{total}</h3>
          <p>Tổng số sự kiện</p>
          <div className="events-stat-sub">Bao gồm tất cả trạng thái</div>
        </div>
      </div>
      <div className="events-stat-card">
        <div className="events-stat-icon running">⚡</div>
        <div className="events-stat-content">
          <h3>{running}</h3>
          <p>Đang diễn ra</p>
          <div className="events-stat-sub">Hiển thị trên ứng dụng người dùng</div>
        </div>
      </div>
      <div className="events-stat-card">
        <div className="events-stat-icon upcoming">📅</div>
        <div className="events-stat-content">
          <h3>{upcoming}</h3>
          <p>Sắp diễn ra</p>
          <div className="events-stat-sub">Chuẩn bị khởi động trong thời gian tới</div>
        </div>
      </div>
      <div className="events-stat-card">
        <div className="events-stat-icon promo">🏷️</div>
        <div className="events-stat-content">
          <h3>{withPromo}</h3>
          <p>Có khuyến mãi</p>
          <div className="events-stat-sub">Bao gồm ưu đãi cho người dùng</div>
        </div>
      </div>
    </div>
  )
}

export default EventsStats
