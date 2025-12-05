import React from 'react'
import type { GuestCardStats as GuestCardStatsType } from './guestCardTypes'
import '../../pages/operator/manage-guest-card/ManageGuestCard.css'

interface GuestCardStatsProps {
  stats: GuestCardStatsType
}

export const GuestCardStats: React.FC<GuestCardStatsProps> = ({ stats }) => {
  return (
    <div className="guest-card-stats-section">
      <div className="guest-card-stat-card">
        <div className="guest-card-stat-icon active">✅</div>
        <div className="guest-card-stat-content">
          <h3>{stats.active}</h3>
          <p>Đang hoạt động</p>
          <div className="guest-card-stat-sub">Thẻ đang được sử dụng</div>
        </div>
      </div>
      <div className="guest-card-stat-card">
        <div className="guest-card-stat-icon inactive">⏸️</div>
        <div className="guest-card-stat-content">
          <h3>{stats.inactive}</h3>
          <p>Không hoạt động</p>
          <div className="guest-card-stat-sub">Thẻ đã bị vô hiệu hóa</div>
        </div>
      </div>
      <div className="guest-card-stat-card">
        <div className="guest-card-stat-icon lost">🔍</div>
        <div className="guest-card-stat-content">
          <h3>{stats.lost}</h3>
          <p>Bị mất</p>
          <div className="guest-card-stat-sub">Thẻ đã bị mất</div>
        </div>
      </div>
      <div className="guest-card-stat-card">
        <div className="guest-card-stat-icon damaged">⚠️</div>
        <div className="guest-card-stat-content">
          <h3>{stats.damaged}</h3>
          <p>Bị hỏng</p>
          <div className="guest-card-stat-sub">Thẻ đã bị hỏng</div>
        </div>
      </div>
      <div className="guest-card-stat-card">
        <div className="guest-card-stat-icon locked">🔒</div>
        <div className="guest-card-stat-content">
          <h3>{stats.locked}</h3>
          <p>Đã khóa</p>
          <div className="guest-card-stat-sub">Thẻ đã bị khóa</div>
        </div>
      </div>
    </div>
  )
}

export default GuestCardStats
