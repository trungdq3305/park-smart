import React, { useMemo, useState } from 'react'
import { useGetPromotionsQuery } from '../../../features/operator/promotionAPI'
import type { Promotion } from '../../../types/Promotion'
import {
  PromotionStats,
  PromotionFilters,
  PromotionList,
  PromotionEmptyState,
  getPromotionStatus,
  type PromotionFilter,
} from '../../../components/promotions'
import './ManagePromotionsAdmin.css'

const ManagePromotionsAdmin: React.FC = () => {
  const [filter, setFilter] = useState<PromotionFilter>('all')
  const { data, isLoading, error } = useGetPromotionsQuery({})

  const promotions: Promotion[] = Array.isArray(data)
    ? data
    : (data as { data?: Promotion[] })?.data || []

  const stats = useMemo(() => {
    const total = promotions.length
    let active = 0
    let inactive = 0
    let upcoming = 0
    let ended = 0
    let exhausted = 0

    promotions.forEach((promotion) => {
      const status = getPromotionStatus(promotion)
      if (status.class === 'promotion-status-active') active += 1
      if (status.class === 'promotion-status-inactive') inactive += 1
      if (status.class === 'promotion-status-upcoming') upcoming += 1
      if (status.class === 'promotion-status-ended') ended += 1
      if (status.class === 'promotion-status-exhausted') exhausted += 1
    })

    return { total, active, inactive, upcoming, ended, exhausted }
  }, [promotions])

  const filteredPromotions = useMemo(() => {
    if (filter === 'all') return promotions
    return promotions.filter((promotion) => {
      const status = getPromotionStatus(promotion)
      if (filter === 'active') return status.class === 'promotion-status-active'
      if (filter === 'inactive') return status.class === 'promotion-status-inactive'
      if (filter === 'upcoming') return status.class === 'promotion-status-upcoming'
      if (filter === 'ended') return status.class === 'promotion-status-ended'
      if (filter === 'exhausted') return status.class === 'promotion-status-exhausted'
      return true
    })
  }, [promotions, filter])

  if (isLoading) {
    return (
      <div className="manage-promotions-admin-page">
        <div className="promotion-loading">
          <div className="promotion-loading-spinner" />
          <p>Đang tải danh sách khuyến mãi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-promotions-admin-page">
        <div className="promotion-error">
          <span className="promotion-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-promotions-admin-page">
      <div className="promotion-page-header">
        <div>
          <h1>Quản lý khuyến mãi</h1>
          <p>Xem và theo dõi tất cả các chương trình khuyến mãi trong hệ thống</p>
        </div>
      </div>

      <div className="promotion-page-content">
        <PromotionStats stats={stats} />

        <PromotionFilters
          filter={filter}
          onFilterChange={setFilter}
          totalCount={stats.total}
          filteredCount={filteredPromotions.length}
        />

        {filteredPromotions.length === 0 ? (
          <PromotionEmptyState filter={filter} />
        ) : (
          <PromotionList promotions={filteredPromotions} />
        )}
      </div>
    </div>
  )
}

export default ManagePromotionsAdmin
