import React, { useMemo, useState } from 'react'
import { useGetPromotionsOperatorQuery } from '../../../features/operator/promotionAPI'
import { useOperatorId } from '../../../hooks/useOperatorId'
import type { Promotion } from '../../../types/Promotion'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { message } from 'antd'
import './ManagePromotion.css'

type PromotionFilter = 'all' | 'active' | 'inactive' | 'upcoming' | 'ended' | 'exhausted'

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}   

const formatRuleValue = (ruleValue: string): string => {
  // Kiểm tra xem ruleValue có phải là số không
  const numericValue = parseFloat(ruleValue)
  if (!isNaN(numericValue) && isFinite(numericValue)) {
    // Format thành VNĐ với format giống như các phần khác (dùng toLocaleString)
    return `${numericValue.toLocaleString('vi-VN')} ₫`
  }
  // Nếu không phải số, trả về giá trị gốc
  return ruleValue
}

const getDiscountText = (promotion: Promotion): string => {
  if (promotion.discountType === 'PERCENTAGE') {
    return `Giảm ${promotion.discountValue}%`
  }
  return `Giảm ${promotion.discountValue.toLocaleString()} đ`
}

const getPromotionStatus = (promotion: Promotion): { label: string; class: string } => {
  const now = new Date()
  const startDate = new Date(promotion.startDate)
  const endDate = new Date(promotion.endDate)

  if (!promotion.isActive) {
    return { label: 'Đã vô hiệu', class: 'promotion-status-inactive' }
  }

  if (now < startDate) {
    return { label: 'Sắp diễn ra', class: 'promotion-status-upcoming' }
  }

  if (now >= startDate && now <= endDate) {
    if (promotion.currentUsageCount >= promotion.totalUsageLimit) {
      return { label: 'Đã hết lượt', class: 'promotion-status-exhausted' }
    }
    return { label: 'Đang hoạt động', class: 'promotion-status-active' }
  }

  return { label: 'Đã kết thúc', class: 'promotion-status-ended' }
}

const getStatusLabel = (filter: PromotionFilter): string => {
  const statusMap: Record<string, string> = {
    all: 'Tất cả',
    active: 'Đang hoạt động',
    inactive: 'Đã vô hiệu',
    upcoming: 'Sắp diễn ra',
    ended: 'Đã kết thúc',
    exhausted: 'Đã hết lượt',
  }
  return statusMap[filter] || filter
}

const ManagePromotion: React.FC = () => {
  const operatorId = useOperatorId()
  const [filter, setFilter] = useState<PromotionFilter>('all')
  const { data, isLoading, error } = useGetPromotionsOperatorQuery({ operatorId })

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
      <div className="manage-promotion-page">
        <div className="promotion-loading">
          <div className="promotion-loading-spinner" />
          <p>Đang tải danh sách khuyến mãi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-promotion-page">
        <div className="promotion-error">
          <span className="promotion-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-promotion-page">
      <div className="promotion-page-header">
        <div className="promotion-header-content">
          <div>
            <h1>Quản lý khuyến mãi</h1>
            <p>Xem và quản lý tất cả các chương trình khuyến mãi của bạn</p>
          </div>
          <button className="promotion-create-btn">
            <PlusOutlined />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      <div className="promotion-page-content">
        {/* Stats Section */}
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

        {/* Filters */}
        <div className="promotion-controls-card">
          <div className="promotion-filter-wrapper">
            <label htmlFor="status-filter" className="promotion-filter-label">
              Lọc theo trạng thái:
            </label>
            <select
              id="status-filter"
              className="promotion-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as PromotionFilter)}
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
            Đang hiển thị <strong>{filteredPromotions.length}</strong> / {stats.total} khuyến mãi
          </div>
        </div>

        {/* Promotion List */}
        {filteredPromotions.length === 0 ? (
          <div className="promotion-empty-state">
            <div className="promotion-empty-icon">🎁</div>
            <h3 className="promotion-empty-title">Chưa có khuyến mãi nào</h3>
            <p className="promotion-empty-text">
              {filter === 'all'
                ? 'Chưa có chương trình khuyến mãi nào trong hệ thống.'
                : `Không có khuyến mãi với bộ lọc "${getStatusLabel(filter)}".`}
            </p>
          </div>
        ) : (
          <div className="promotion-list">
            {filteredPromotions.map((promotion) => {
              const status = getPromotionStatus(promotion)
              const discountText = getDiscountText(promotion)
              const usagePercentage =
                promotion.totalUsageLimit > 0
                  ? Math.round((promotion.currentUsageCount / promotion.totalUsageLimit) * 100)
                  : 0

              return (
                <div key={promotion._id} className="promotion-item">
                  <div className="promotion-item-header">
                    <div className="promotion-item-title-section">
                      <h3 className="promotion-item-title">{promotion.name}</h3>
                      <div className={`promotion-status-badge ${status.class}`}>
                        <span className="promotion-status-dot" />
                        <span>{status.label}</span>
                      </div>
                    </div>
                    <div className="promotion-discount-badge">
                      <span className="promotion-discount-icon">💰</span>
                      <span className="promotion-discount-text">{discountText}</span>
                    </div>
                  </div>

                  <div className="promotion-item-body">
                    {promotion.description && (
                      <div className="promotion-description">
                        <p>{promotion.description}</p>
                      </div>
                    )}

                    <div className="promotion-code-section">
                      <span className="promotion-code-label">Mã khuyến mãi:</span>
                      <div className="promotion-code-value">
                        <code>{promotion.code}</code>
                        <button
                          className="promotion-code-copy"
                          onClick={() => {
                            navigator.clipboard.writeText(promotion.code)
                            message.success('Đã sao chép mã khuyến mãi')
                          }}
                          title="Sao chép mã"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    <div className="promotion-details-grid">
                      <div className="promotion-detail-item">
                        <div className="promotion-detail-icon">📅</div>
                        <div className="promotion-detail-content">
                          <span className="promotion-detail-label">Bắt đầu</span>
                          <span className="promotion-detail-value">
                            {formatDate(promotion.startDate)}
                          </span>
                        </div>
                      </div>

                      <div className="promotion-detail-item">
                        <div className="promotion-detail-icon">🏁</div>
                        <div className="promotion-detail-content">
                          <span className="promotion-detail-label">Kết thúc</span>
                          <span className="promotion-detail-value">
                            {formatDate(promotion.endDate)}
                          </span>
                        </div>
                      </div>

                      {promotion.maxDiscountAmount && (
                        <div className="promotion-detail-item">
                          <div className="promotion-detail-icon">💵</div>
                          <div className="promotion-detail-content">
                            <span className="promotion-detail-label">Giảm tối đa</span>
                            <span className="promotion-detail-value">
                              {promotion.maxDiscountAmount.toLocaleString()} đ
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="promotion-detail-item">
                        <div className="promotion-detail-icon">🎫</div>
                        <div className="promotion-detail-content">
                          <span className="promotion-detail-label">Sử dụng</span>
                          <span className="promotion-detail-value">
                            {promotion.currentUsageCount} / {promotion.totalUsageLimit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="promotion-usage-progress">
                      <div className="promotion-usage-header">
                        <span className="promotion-usage-label">Tỷ lệ sử dụng</span>
                        <span className="promotion-usage-percentage">{usagePercentage}%</span>
                      </div>
                      <div className="promotion-usage-bar">
                        <div
                          className="promotion-usage-fill"
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    </div>

                    {promotion.rules && promotion.rules.length > 0 && (
                      <div className="promotion-rules-section">
                        <div className="promotion-rules-header">
                          <span className="promotion-rules-title">Điều kiện áp dụng</span>
                        </div>
                        <div className="promotion-rules-list">
                          {promotion.rules.map((rule) => (
                            <div key={rule._id} className="promotion-rule-item">
                              <div className="promotion-rule-type">
                                <span className="promotion-rule-type-label">{rule.ruleType}:</span>
                              </div>
                              <div className="promotion-rule-value">{formatRuleValue(rule.ruleValue)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {promotion.eventTitle && (
                      <div className="promotion-event-info">
                        <span className="promotion-event-label">Sự kiện:</span>
                        <span className="promotion-event-value">{promotion.eventTitle}</span>
                      </div>
                    )}
                  </div>

                  <div className="promotion-item-footer">
                    <div className="promotion-date-info">
                      <div className="promotion-date-item">
                        <span className="promotion-date-label">Tạo lúc:</span>
                        <span className="promotion-date-value">
                          {formatDate(promotion.createdAt)}
                        </span>
                      </div>
                      {promotion.updatedAt && (
                        <div className="promotion-date-item">
                          <span className="promotion-date-label">Cập nhật:</span>
                          <span className="promotion-date-value">
                            {formatDate(promotion.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="promotion-item-actions">
                      <button className="promotion-edit-btn" title="Chỉnh sửa khuyến mãi">
                        <EditOutlined />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button className="promotion-delete-btn" title="Xóa khuyến mãi">
                        <DeleteOutlined />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagePromotion
