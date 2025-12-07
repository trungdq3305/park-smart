import React from 'react'
import type { PromotionStats } from './promotionTypes'
import './PromotionStats.css'

interface PromotionStatsProps {
  stats: PromotionStats
}

const PromotionStatsComponent: React.FC<PromotionStatsProps> = ({ stats }) => {
  return (
    <div className="promotion-stats-section">
      <div className="promotion-stat-card">
        <div className="promotion-stat-icon total">🎁</div>
        <div className="promotion-stat-content">
          <h3>{stats.total}</h3>
          <p>Tổng khuyến mãi</p>
          <div className="promotion-stat-sub">Tất cả chương trình</div>
        </div>
      </div>
      <div className="promotion-stat-card">
        <div className="promotion-stat-icon active">✅</div>
        <div className="promotion-stat-content">
          <h3>{stats.active}</h3>
          <p>Đang hoạt động</p>
          <div className="promotion-stat-sub">Khuyến mãi hiện tại</div>
        </div>
      </div>
      <div className="promotion-stat-card">
        <div className="promotion-stat-icon upcoming">⏰</div>
        <div className="promotion-stat-content">
          <h3>{stats.upcoming}</h3>
          <p>Sắp diễn ra</p>
          <div className="promotion-stat-sub">Sắp bắt đầu</div>
        </div>
      </div>
      <div className="promotion-stat-card">
        <div className="promotion-stat-icon ended">🏁</div>
        <div className="promotion-stat-content">
          <h3>{stats.ended}</h3>
          <p>Đã kết thúc</p>
          <div className="promotion-stat-sub">Đã hoàn thành</div>
        </div>
      </div>
      <div className="promotion-stat-card">
        <div className="promotion-stat-icon exhausted">🔒</div>
        <div className="promotion-stat-content">
          <h3>{stats.exhausted}</h3>
          <p>Đã hết lượt</p>
          <div className="promotion-stat-sub">Hết quota</div>
        </div>
      </div>
      <div className="promotion-stat-card">
        <div className="promotion-stat-icon inactive">❌</div>
        <div className="promotion-stat-content">
          <h3>{stats.inactive}</h3>
          <p>Đã vô hiệu</p>
          <div className="promotion-stat-sub">Đã tắt</div>
        </div>
      </div>
    </div>
  )
}

export default PromotionStatsComponent
