import React from 'react'
import type { GuestCard } from '../../types/guestCard'
import { getStatusLabel, getStatusClass, formatDate, getCardGradient } from './guestCardUtils'
import '../../pages/operator/manage-guest-card/ManageGuestCard.css'

interface GuestCardItemProps {
  card: GuestCard
  index: number
  onStatusToggle: (card: GuestCard) => void
  onDelete: (card: GuestCard) => void
}

export const GuestCardItem: React.FC<GuestCardItemProps> = ({
  card,
  index,
  onStatusToggle,
  onDelete,
}) => {
  const statusClass = getStatusClass(card.status)
  const statusLabel = getStatusLabel(card.status)
  const cardGradient = getCardGradient(index)

  return (
    <article
      key={card._id}
      className="guest-card-item"
      style={{ '--card-index': index % 10 } as React.CSSProperties}
    >
      <div className="guest-card-header" style={{ background: cardGradient }}>
        <div className="guest-card-chip">
          <div className="guest-card-chip-line" />
          <div className="guest-card-chip-line" />
          <div className="guest-card-chip-line" />
        </div>
        <div className={`guest-card-status-badge ${statusClass}`}>
          <span className="guest-card-status-dot" />
          <span>{statusLabel}</span>
        </div>
      </div>

      <div className="guest-card-body">
        <div className="guest-card-code-section">
          <div className="guest-card-code-label">Mã thẻ</div>
          <div className="guest-card-code-value">{card.code || 'N/A'}</div>
        </div>

        <div className="guest-card-details">
          <div className="guest-card-detail-item">
            <div className="guest-card-detail-icon">📡</div>
            <div className="guest-card-detail-content">
              <span className="guest-card-detail-label">NFC UID</span>
              <span className="guest-card-detail-value">{card.nfcUid || 'Chưa có'}</span>
            </div>
          </div>

          <div className="guest-card-detail-item">
            <div className="guest-card-detail-icon">🆔</div>
            <div className="guest-card-detail-content">
              <span className="guest-card-detail-label">ID thẻ</span>
              <span className="guest-card-detail-value">{card._id}...</span>
            </div>
          </div>

          <div className="guest-card-detail-item">
            <div className="guest-card-detail-icon">🏢</div>
            <div className="guest-card-detail-content">
              <span className="guest-card-detail-label">Bãi đỗ xe</span>
              <span className="guest-card-detail-value">{card.parkingLotId || 'N/A'}...</span>
            </div>
          </div>
        </div>
      </div>

      <div className="guest-card-footer">
        <div className="guest-card-date-info">
          <div className="guest-card-date-item">
            <span className="guest-card-date-label">Tạo lúc:</span>
            <span className="guest-card-date-value">{formatDate(card.createdAt)}</span>
          </div>
          <div className="guest-card-date-item">
            <span className="guest-card-date-label">Cập nhật:</span>
            <span className="guest-card-date-value">{formatDate(card.updatedAt)}</span>
          </div>
        </div>

        <div className="guest-card-actions">
          <button
            type="button"
            className="guest-card-action-btn toggle"
            onClick={() => onStatusToggle(card)}
            title={card.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          >
            {card.status === 'ACTIVE' ? '⏸️' : '▶️'}
          </button>
          <button
            type="button"
            className="guest-card-action-btn delete"
            onClick={() => onDelete(card)}
            title="Xóa thẻ"
          >
            🗑️
          </button>
        </div>
      </div>
    </article>
  )
}

export default GuestCardItem

