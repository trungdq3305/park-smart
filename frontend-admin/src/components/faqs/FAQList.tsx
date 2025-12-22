import React, { useRef, useEffect, useCallback } from 'react'
import type { FAQ } from '../../types/FAQs'
import type { FAQFilter } from './faqTypes'
import { getFilterLabel } from './faqUtils'
import FAQItem from './FAQItem'
import '../../pages/admin/manage-faqs/ManageFAQsAdmin.css'

interface FAQListProps {
  faqs: FAQ[]
  filter: FAQFilter
  onEdit?: (faq: FAQ) => void
  onDelete?: (faqId: string, faqQuestion: string) => void
  isDeleting?: boolean
  hasMorePages?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  totalItems?: number
}

export const FAQList: React.FC<FAQListProps> = ({
  faqs,
  filter,
  onEdit,
  onDelete,
  isDeleting,
  hasMorePages,
  isLoading,
  onLoadMore,
  totalItems,
}) => {
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    if (!isLoading && hasMorePages && onLoadMore) {
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

  if (faqs.length === 0) {
    return (
      <div className="faq-empty-state">
        <div className="faq-empty-icon">📭</div>
        <h3 className="faq-empty-title">Chưa có FAQs nào</h3>
        <p className="faq-empty-text">
          {filter === 'all'
            ? 'Chưa có FAQs nào trong hệ thống.'
            : `Không có FAQs với bộ lọc "${getFilterLabel(filter)}".`}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="faq-list">
        {faqs.map((faq) => (
          <FAQItem
            key={faq._id}
            faq={faq}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ))}
      </div>

      {/* Infinite Scroll Observer Target */}
      {hasMorePages && (
        <div ref={observerTarget} className="faq-load-more-trigger">
          {isLoading ? (
            <div className="faq-load-more-loading">
              <div className="faq-loading-spinner" />
              <p>Đang tải thêm FAQs...</p>
            </div>
          ) : (
            <div style={{ minHeight: '20px' }} />
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMorePages && faqs.length > 0 && (
        <div className="faq-end-message">
          <p>Đã hiển thị tất cả {totalItems || faqs.length} FAQs</p>
        </div>
      )}
    </>
  )
}

export default FAQList
