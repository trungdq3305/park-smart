import React from 'react'
import './PaginationLoading.css'

interface PaginationLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}

const PaginationLoading: React.FC<PaginationLoadingProps> = ({
  isLoading,
  children,
  loadingText = 'Đang tải trang...',
  className = '',
}) => {
  return (
    <div className={`pagination-loading-wrapper ${className}`}>
      {isLoading && (
        <div className="pagination-loading-overlay">
          <div className="pagination-loading-spinner"></div>
          <p className="pagination-loading-text">{loadingText}</p>
        </div>
      )}
      {children}
    </div>
  )
}

export default PaginationLoading
