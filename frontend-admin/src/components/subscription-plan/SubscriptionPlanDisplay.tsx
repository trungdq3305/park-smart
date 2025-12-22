import React from 'react'
import dayjs from 'dayjs'
import type { SubscriptionPlan } from '../../types/Subscription'
import './SubscriptionPlanDisplay.css'

interface SubscriptionPlanDisplayProps {
  plan: SubscriptionPlan
  title?: string
  showEditButton?: boolean
  onEditClick?: () => void
  isLoading?: boolean
}

const SubscriptionPlanDisplay: React.FC<SubscriptionPlanDisplayProps> = ({
  plan,
  title = 'Gói Đăng Ký Mặc Định',
  showEditButton = false,
  onEditClick,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return dayjs(date).format('DD/MM/YYYY HH:mm')
  }

  if (isLoading) {
    return (
      <div className="sub-plan-page">
        <div className="sub-plan-loading">
          <div className="sub-plan-spinner" />
          <span>Đang tải thông tin gói đăng ký...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="sub-plan-page">
      {/* Header */}
      <div className="sub-plan-header">
        <div className="sub-plan-header-left">
          <div className="sub-plan-header-icon">💳</div>
          <div className="sub-plan-header-text">
            <h1 className="sub-plan-title">{title}</h1>
            <p className="sub-plan-subtitle">{plan.name}</p>
          </div>
        </div>
        <div className="sub-plan-header-right">
          <div className={`sub-plan-status-badge ${plan.isActive ? 'active' : 'inactive'}`}>
            <span className="sub-plan-status-dot"></span>
            {plan.isActive ? 'Đang hoạt động' : 'Đã vô hiệu'}
          </div>
          {showEditButton && onEditClick && (
            <button className="sub-plan-edit-btn" onClick={onEditClick}>
              ✏️ Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="sub-plan-card">
        {/* Content Grid */}
        <div className="sub-plan-card-body">
          <div className="sub-plan-info-grid">
            <div className="sub-plan-info-item featured">
              <div className="sub-plan-info-icon">💰</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Phí hàng tháng</div>
                <div className="sub-plan-info-value highlight">
                  {formatCurrency(plan.monthlyFeeAmount)}
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item featured">
              <div className="sub-plan-info-icon">⚠️</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Phí phạt</div>
                <div className="sub-plan-info-value warning">
                  {formatCurrency(plan.penaltyFeeAmount)}
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">⏱️</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Thời gian gia hạn</div>
                <div className="sub-plan-info-value">{plan.gracePeriodDays} ngày</div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">⏸️</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Tháng quá hạn tạm ngưng</div>
                <div className="sub-plan-info-value">
                  {plan.maxOverdueMonthsBeforeSuspension} tháng
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item ">
              <div className="sub-plan-info-icon">📝</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Mô tả</div>
                <div className="sub-plan-info-value muted">
                  {plan.description || 'Không có mô tả'}
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item ">
              <div className="sub-plan-info-icon">🔑</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">ID</div>
                <div className="sub-plan-info-value muted mono">{plan.id}</div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">📅</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Ngày thanh toán</div>
                <div className="sub-plan-info-value">Ngày {plan.billingDayOfMonth}</div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">📆</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Ngày tạo</div>
                <div className="sub-plan-info-value muted">{formatDate(plan.createdAt)}</div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">🔄</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Ngày cập nhật</div>
                <div className="sub-plan-info-value muted">{formatDate(plan.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlanDisplay
