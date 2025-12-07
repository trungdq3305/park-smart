import { Switch } from 'antd'
import { CloseCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { PricingPolicyLink } from '../../types/PricingPolicyLink'
import '../../pages/operator/parking-lot/ParkingLot.css'

interface PricingPolicyListProps {
  policies: PricingPolicyLink[]
  loading: boolean
  isDeleted: boolean
  onIsDeletedChange: (isDeleted: boolean) => void
  onOpenCreateModal?: () => void
  onOpenEditModal?: (policy: PricingPolicyLink) => void
  onDelete?: (policyId: string) => void
}

const getPriorityColor = (priority: number): string => {
  if (priority >= 8 && priority <= 10) {
    return 'priority-high'
  } else if (priority >= 4 && priority <= 7) {
    return 'priority-medium'
  }
  return 'priority-low'
}

const getPriorityLabel = (priority: number): string => {
  if (priority >= 8 && priority <= 10) {
    return 'Cao'
  } else if (priority >= 4 && priority <= 7) {
    return 'Trung bình'
  }
  return 'Thấp'
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

const PricingPolicyList: React.FC<PricingPolicyListProps> = ({
  policies,
  loading,
  isDeleted,
  onIsDeletedChange,
  onOpenCreateModal,
  onOpenEditModal,
  onDelete,
}) => {
  const sortedPolicies = [...policies].sort((a, b) =>
    (a.pricingPolicyId.basisId?.basisName || '').localeCompare(
      b.pricingPolicyId.basisId?.basisName || ''
    )
  )

  if (loading) {
    return (
      <div className="pricing-policy-section">
        <div className="pricing-policy-loading">
          <div className="pricing-policy-loading-spinner" />
          <p>Đang tải danh sách chính sách giá...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pricing-policy-section">
      <div className="pricing-policy-header">
        <div className="pricing-policy-header-content">
          <div>
            <h2>Chính sách giá</h2>
            <p>Quản lý các chính sách giá cho bãi đỗ xe của bạn</p>
          </div>
          <div className="pricing-policy-header-actions">
            {onOpenCreateModal && (
              <button className="pricing-policy-create-btn" onClick={onOpenCreateModal}>
                <PlusOutlined />
                <span>Tạo mới</span>
              </button>
            )}
            <div className="pricing-policy-toggle">
              <span className="pricing-policy-toggle-label">Hiển thị đã xóa:</span>
              <Switch checked={isDeleted} onChange={onIsDeletedChange} />
            </div>
          </div>
        </div>
      </div>

      {sortedPolicies.length === 0 ? (
        <div className="pricing-policy-empty-state">
          <div className="pricing-policy-empty-icon">💰</div>
          <h3 className="pricing-policy-empty-title">Chưa có chính sách giá</h3>
          <p className="pricing-policy-empty-text">
            {isDeleted
              ? 'Không có chính sách giá đã xóa.'
              : 'Bạn chưa tạo chính sách giá nào. Hãy tạo chính sách giá đầu tiên để bắt đầu.'}
          </p>
        </div>
      ) : (
        <div className="pricing-policy-list">
          {sortedPolicies.map((link) => {
            const policy = link.pricingPolicyId
            const isPackage = policy.basisId?.basisName === 'PACKAGE'
            const isTiered = policy.basisId?.basisName === 'TIERED'
            const isDisabled = link.endDate != null
            const priorityClass = getPriorityColor(link.priority)
            const priorityLabel = getPriorityLabel(link.priority)

            return (
              <div
                key={link._id}
                className={`pricing-policy-item ${isDisabled ? 'pricing-policy-item--disabled' : ''}`}
              >
                <div className="pricing-policy-item-header">
                  <div className="pricing-policy-item-title-section">
                    <h3 className="pricing-policy-item-title">{policy.name}</h3>
                    <div className="pricing-policy-item-badges">
                      {isDisabled && (
                        <div className="pricing-policy-badge pricing-policy-badge--disabled">
                          <CloseCircleOutlined />
                          <span>Đã vô hiệu</span>
                        </div>
                      )}
                      <div
                        className={`pricing-policy-badge pricing-policy-badge--${priorityClass}`}
                      >
                        <span>Ưu tiên {link.priority}</span>
                        <span className="pricing-policy-priority-label">({priorityLabel})</span>
                      </div>
                    </div>
                  </div>
                  <div className="pricing-policy-item-actions">
                    {!isDisabled && onOpenEditModal && (
                      <button
                        className="pricing-policy-action-btn pricing-policy-action-btn--edit"
                        onClick={() => onOpenEditModal(link)}
                      >
                        <EditOutlined />
                        <span>Chỉnh sửa</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="pricing-policy-action-btn pricing-policy-action-btn--delete"
                        onClick={() => onDelete(link._id)}
                      >
                        <DeleteOutlined />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pricing-policy-item-body">
                  <div className="pricing-policy-item-main-info">
                    <div className="pricing-policy-info-grid">
                      <div className="pricing-policy-info-item">
                        <div className="pricing-policy-info-icon">💵</div>
                        <div className="pricing-policy-info-content">
                          <span className="pricing-policy-info-label">Giá mỗi giờ</span>
                          <span className="pricing-policy-info-value">
                            {policy.pricePerHour != null
                              ? `${policy.pricePerHour.toLocaleString()} đ`
                              : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="pricing-policy-info-item">
                        <div className="pricing-policy-info-icon">💳</div>
                        <div className="pricing-policy-info-content">
                          <span className="pricing-policy-info-label">Giá cố định</span>
                          <span className="pricing-policy-info-value">
                            {policy.fixedPrice != null
                              ? `${policy.fixedPrice.toLocaleString()} đ`
                              : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="pricing-policy-info-item">
                        <div className="pricing-policy-info-icon">📅</div>
                        <div className="pricing-policy-info-content">
                          <span className="pricing-policy-info-label">Ngày áp dụng</span>
                          <span className="pricing-policy-info-value">
                            {new Date(link.startDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      {isDisabled && link.endDate && (
                        <div className="pricing-policy-info-item">
                          <div className="pricing-policy-info-icon">🏁</div>
                          <div className="pricing-policy-info-content">
                            <span className="pricing-policy-info-label">Ngày kết thúc</span>
                            <span className="pricing-policy-info-value pricing-policy-info-value--disabled">
                              {new Date(link.endDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pricing-policy-item-type">
                    <span className="pricing-policy-type-label">Loại chính sách:</span>
                    <span className="pricing-policy-type-value">
                      {policy.basisId?.basisName || 'Không xác định'} -{' '}
                      {policy.basisId?.description || 'Không có mô tả'}
                    </span>
                  </div>

                  {isPackage && policy.packageRateId && (
                    <div className="pricing-policy-item-package">
                      <div className="pricing-policy-package-header">
                        <span className="pricing-policy-package-icon">📦</span>
                        <span className="pricing-policy-package-title">Gói cố định</span>
                      </div>
                      <div className="pricing-policy-package-details">
                        <div className="pricing-policy-package-detail">
                          <span className="pricing-policy-package-label">Tên gói:</span>
                          <span className="pricing-policy-package-value">
                            {policy.packageRateId.name}
                          </span>
                        </div>
                        <div className="pricing-policy-package-detail">
                          <span className="pricing-policy-package-label">Giá gói:</span>
                          <span className="pricing-policy-package-value">
                            {policy.packageRateId.price.toLocaleString()} đ
                          </span>
                        </div>
                        <div className="pricing-policy-package-detail">
                          <span className="pricing-policy-package-label">Thời lượng:</span>
                          <span className="pricing-policy-package-value">
                            {policy.packageRateId.durationAmount} {policy.packageRateId.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isTiered && policy.tieredRateSetId && (
                    <div className="pricing-policy-item-tiered">
                      <div className="pricing-policy-tiered-header">
                        <span className="pricing-policy-tiered-icon">⏰</span>
                        <span className="pricing-policy-tiered-title">
                          Bảng giá theo khung giờ: {policy.tieredRateSetId.name}
                        </span>
                      </div>
                      <div className="pricing-policy-tiered-table">
                        {policy.tieredRateSetId.tiers.map((tier, index) => (
                          <div key={index} className="pricing-policy-tiered-row">
                            <span className="pricing-policy-tiered-time">
                              {tier.fromHour} - {tier.toHour ?? '∞'}
                            </span>
                            <span className="pricing-policy-tiered-price">
                              {tier.price.toLocaleString()} đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pricing-policy-item-footer">
                  <div className="pricing-policy-item-dates">
                    <div className="pricing-policy-date-item">
                      <span className="pricing-policy-date-label">Tạo lúc:</span>
                      <span className="pricing-policy-date-value">
                        {link.createdAt ? formatDate(link.createdAt) : '—'}
                      </span>
                    </div>
                    {link.updatedAt && (
                      <div className="pricing-policy-date-item">
                        <span className="pricing-policy-date-label">Cập nhật:</span>
                        <span className="pricing-policy-date-value">
                          {formatDate(link.updatedAt)}
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
  )
}

export default PricingPolicyList
