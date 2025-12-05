import React, { useState, useEffect } from 'react'
import type { GuestCard } from '../../types/guestCard'
import '../../pages/operator/manage-guest-card/ManageGuestCard.css'

interface GuestCardEditModalProps {
  card: GuestCard | null
  isOpen: boolean
  onClose: () => void
  onSave: (cardId: string, code: string) => Promise<void>
  isLoading?: boolean
}

export const GuestCardEditModal: React.FC<GuestCardEditModalProps> = ({
  card,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [code, setCode] = useState<string>('')

  useEffect(() => {
    if (card) {
      setCode(card.code || '')
    }
  }, [card])

  useEffect(() => {
    if (!isOpen) {
      setCode('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card || !code.trim()) return

    try {
      await onSave(card._id, code.trim())
      onClose()
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !card) return null

  return (
    <div className="guest-card-edit-modal-overlay" onClick={handleOverlayClick}>
      <div className="guest-card-edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="guest-card-edit-modal-header">
          <h2>Cập nhật thông tin thẻ</h2>
          <button type="button" className="guest-card-edit-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="guest-card-edit-modal-form">
          <div className="guest-card-edit-modal-body">
            <div className="guest-card-edit-field">
              <label htmlFor="edit-code" className="guest-card-edit-label">
                Mã thẻ <span className="required">*</span>
              </label>
              <input
                id="edit-code"
                type="text"
                className="guest-card-edit-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Nhập mã thẻ..."
                required
                autoFocus
                disabled={isLoading}
              />
              <p className="guest-card-edit-hint">
                Mã thẻ hiện tại: <strong>{card.code || 'N/A'}</strong>
              </p>
            </div>

            <div className="guest-card-edit-info">
              <div className="guest-card-edit-info-item">
                <span className="guest-card-edit-info-label">NFC UID:</span>
                <span className="guest-card-edit-info-value">{card.nfcUid || 'Chưa có'}</span>
              </div>
              <div className="guest-card-edit-info-item">
                <span className="guest-card-edit-info-label">Trạng thái:</span>
                <span className="guest-card-edit-info-value">{card.status}</span>
              </div>
            </div>
          </div>

          <div className="guest-card-edit-modal-footer">
            <button
              type="button"
              className="guest-card-edit-btn cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="guest-card-edit-btn save"
              disabled={isLoading || !code.trim() || code.trim() === card.code}
            >
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GuestCardEditModal
