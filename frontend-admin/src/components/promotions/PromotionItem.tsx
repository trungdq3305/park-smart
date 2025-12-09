import React from 'react'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { message } from 'antd'
import type { Promotion } from '../../types/Promotion'
import { formatDate, formatRuleValue, getDiscountText, getPromotionStatus } from './promotionUtils'
import '../promotions/PromotionItem.css'

interface PromotionItemProps {
  promotion: Promotion
  onEdit?: (promotion: Promotion) => void
  onDelete?: (promotionId: string, promotionName: string) => void
}

const PromotionItem: React.FC<PromotionItemProps> = ({ promotion, onEdit, onDelete }) => {
  const status = getPromotionStatus(promotion)
  const discountText = getDiscountText(promotion)
  const usagePercentage =
    promotion.totalUsageLimit > 0
      ? Math.round((promotion.currentUsageCount / promotion.totalUsageLimit) * 100)
      : 0

  return (
    <div className="promotion-item">
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
            <div className="promotion-usage-fill" style={{ width: `${usagePercentage}%` }} />
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
            <span className="promotion-date-value">{formatDate(promotion.createdAt)}</span>
          </div>
          {promotion.updatedAt && (
            <div className="promotion-date-item">
              <span className="promotion-date-label">Cập nhật:</span>
              <span className="promotion-date-value">{formatDate(promotion.updatedAt)}</span>
            </div>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="promotion-item-actions">
            {onEdit && (
              <button
                className="promotion-edit-btn"
                title="Chỉnh sửa khuyến mãi"
                onClick={() => onEdit(promotion)}
              >
                <EditOutlined />
                <span>Chỉnh sửa</span>
              </button>
            )}
            {onDelete && (
              <button
                className="promotion-delete-btn"
                title="Xóa khuyến mãi"
                onClick={() => onDelete(promotion._id, promotion.name)}
              >
                <DeleteOutlined />
                <span>Xóa</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PromotionItem
