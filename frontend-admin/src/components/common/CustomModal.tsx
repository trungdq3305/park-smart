import React, { useEffect, useRef } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import './CustomModal.css'

interface CustomModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string | number
  loading?: boolean
}

const CustomModal: React.FC<CustomModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = '600px',
  loading = false,
}) => {
  const scrollPositionRef = useRef<number>(0)

  useEffect(() => {
    if (open) {
      // Lưu vị trí scroll hiện tại
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop

      // Set overflow hidden và giữ nguyên vị trí scroll
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
    } else {
      // Khôi phục scroll position
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''

      // Scroll về vị trí cũ
      window.scrollTo(0, scrollPositionRef.current)
    }

    return () => {
      // Cleanup khi component unmount
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (scrollPositionRef.current !== undefined) {
        window.scrollTo(0, scrollPositionRef.current)
      }
    }
  }, [open])

  if (!open) return null

  const modalWidth = typeof width === 'number' ? `${width}px` : width

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-container"
        style={{ width: modalWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-modal-header">
          <h2 className="custom-modal-title">{title}</h2>
          <button className="custom-modal-close-btn" onClick={onClose} disabled={loading}>
            <CloseOutlined />
          </button>
        </div>
        <div className="custom-modal-body">{children}</div>
        {footer && <div className="custom-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default CustomModal
