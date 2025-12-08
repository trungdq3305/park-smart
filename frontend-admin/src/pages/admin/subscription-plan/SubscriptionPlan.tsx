import React from 'react'
import dayjs from 'dayjs'
import { useGetDefaultPlanQuery } from '../../../features/admin/subscriptionAPI'
import type { SubscriptionPlan } from '../../../types/Subscription'
import './SubscriptionPlan.css'

const SubscriptionPlanPage: React.FC = () => {
  const { data, isLoading, error } = useGetDefaultPlanQuery({})

  const plan = (data as any) as SubscriptionPlan | undefined

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

  if (error) {
    return (
      <div className="sub-plan-page">
        <div className="sub-plan-error">
          <div className="sub-plan-error-icon">⚠️</div>
          <h2>Không thể tải thông tin gói đăng ký</h2>
          <p>{(error as any)?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu'}</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="sub-plan-page">
        <div className="sub-plan-empty">
          <div className="sub-plan-empty-icon">📋</div>
          <h2>Chưa có gói đăng ký</h2>
          <p>Hiện tại chưa có gói đăng ký nào được thiết lập.</p>
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
            <h1 className="sub-plan-title">Gói Đăng Ký Mặc Định</h1>
            <p className="sub-plan-subtitle">{plan.name}</p>
          </div>
        </div>
        <div className={`sub-plan-status-badge ${plan.isActive ? 'active' : 'inactive'}`}>
          <span className="sub-plan-status-dot"></span>
          {plan.isActive ? 'Đang hoạt động' : 'Đã vô hiệu'}
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
              <div className="sub-plan-info-icon">📅</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Ngày thanh toán</div>
                <div className="sub-plan-info-value">
                  Ngày {plan.billingDayOfMonth}
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">⏱️</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Thời gian gia hạn</div>
                <div className="sub-plan-info-value">
                  {plan.gracePeriodDays} ngày
                </div>
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
            <div className="sub-plan-info-item span-2">
              <div className="sub-plan-info-icon">📝</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Mô tả</div>
                <div className="sub-plan-info-value muted">
                  {plan.description || 'Không có mô tả'}
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item span-2">
              <div className="sub-plan-info-icon">🔑</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">ID</div>
                <div className="sub-plan-info-value muted mono">
                  {plan.id}
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">📆</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Ngày tạo</div>
                <div className="sub-plan-info-value muted">
                  {formatDate(plan.createdAt)}
                </div>
              </div>
            </div>
            <div className="sub-plan-info-item">
              <div className="sub-plan-info-icon">🔄</div>
              <div className="sub-plan-info-content">
                <div className="sub-plan-info-label">Ngày cập nhật</div>
                <div className="sub-plan-info-value muted">
                  {formatDate(plan.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlanPage
