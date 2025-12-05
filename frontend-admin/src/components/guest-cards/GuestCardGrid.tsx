import React, { useRef, useEffect, useCallback } from 'react'
import type { GuestCard } from '../../types/guestCard'
import { GuestCardItem } from './GuestCardItem'
import '../../pages/operator/manage-guest-card/ManageGuestCard.css'

interface GuestCardGridProps {
  cards: GuestCard[]
  hasMorePages: boolean
  isLoading: boolean
  onLoadMore: () => void
  onStatusToggle: (card: GuestCard) => void
  onDelete: (card: GuestCard) => void
  onEdit: (card: GuestCard) => void
  totalItems?: number
}

export const GuestCardGrid: React.FC<GuestCardGridProps> = ({
  cards,
  hasMorePages,
  isLoading,
  onLoadMore,
  onStatusToggle,
  onDelete,
  onEdit,
  totalItems,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    if (!isLoading && hasMorePages) {
      onLoadMore()
    }
  }, [isLoading, hasMorePages, onLoadMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore])

  return (
    <>
      <div className="guest-card-grid">
        {cards.map((card, index) => (
          <GuestCardItem
            key={card._id}
            card={card}
            index={index}
            onStatusToggle={onStatusToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Infinite Scroll Observer Target */}
      {hasMorePages && (
        <div ref={observerTarget} className="guest-card-load-more-trigger">
          {isLoading && (
            <div className="guest-card-load-more-loading">
              <div className="guest-card-loading-spinner" />
              <p>Đang tải thêm thẻ...</p>
            </div>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMorePages && cards.length > 0 && (
        <div className="guest-card-end-message">
          <p>Đã hiển thị tất cả {totalItems || cards.length} thẻ</p>
        </div>
      )}
    </>
  )
}

export default GuestCardGrid

