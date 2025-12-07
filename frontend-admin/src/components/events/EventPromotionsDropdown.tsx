import { useState } from 'react'
import { DownOutlined, UpOutlined, GiftOutlined } from '@ant-design/icons'
import { useGetEventByIdQuery } from '../../features/admin/eventAPI'
import type { Promotion } from '../../types/Promotion'
import './EventPromotionsDropdown.css'

interface EventPromotionsDropdownProps {
  eventId: string
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getDiscountText = (promotion: Promotion): string => {
  if (promotion.discountType === 'Percentage' || promotion.discountType === 'PERCENTAGE') {
    // discountValue là decimal (0.1 = 10%), cần nhân với 100 để hiển thị
    const percentage = promotion.discountValue
    return `Giảm ${percentage}%`
  }
  // FixedAmount: hiển thị số tiền
  return `Giảm ${promotion.discountValue.toLocaleString('vi-VN')} ₫`
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

const EventPromotionsDropdown: React.FC<EventPromotionsDropdownProps> = ({ eventId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { data, isLoading, error } = useGetEventByIdQuery(eventId, {
    skip: !isOpen, // Chỉ fetch khi dropdown mở
  })

  const event = data as { data?: { promotions?: Promotion[] } } | undefined
  const promotions = event?.data?.promotions || []

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="event-promotions-dropdown">
      <button className="event-promotions-toggle" onClick={toggleDropdown}>
        <GiftOutlined />
        <span>Xem khuyến mãi</span>
        {isOpen ? <UpOutlined /> : <DownOutlined />}
      </button>

      {isOpen && (
        <div className="event-promotions-content">
          {isLoading ? (
            <div className="promotions-loading">
              <div className="promotions-loading-spinner" />
              <p>Đang tải danh sách khuyến mãi...</p>
            </div>
          ) : error ? (
            <div className="promotions-error">
              <span className="promotions-error-badge">Lỗi</span>
              <p>Không thể tải danh sách khuyến mãi</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="promotions-empty">
              <div className="promotions-empty-icon">🎁</div>
              <p className="promotions-empty-text">Sự kiện này chưa có khuyến mãi nào</p>
            </div>
          ) : (
            <div className="promotions-list">
              {promotions.map((promotion) => {
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
                        <h4 className="promotion-item-title">{promotion.name}</h4>
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
                                  <span className="promotion-rule-type-label">
                                    {rule.ruleType}:
                                  </span>
                                </div>
                                <div className="promotion-rule-value">{rule.ruleValue}</div>
                              </div>
                            ))}
                          </div>
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
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EventPromotionsDropdown
