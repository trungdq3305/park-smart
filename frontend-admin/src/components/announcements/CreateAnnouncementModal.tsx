import { useEffect, useState } from 'react'
import { CustomModal } from '../common'
import '../promotions/CreatePromotionModal.css'
import './CreateAnnouncementModal.css'

interface CreateAnnouncementModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (announcementData: any) => Promise<void>
  loading?: boolean
}

type SendType = 'now' | 'schedule'

interface FormData {
  title: string
  content: string
  recipientRoles: string[]
  scheduleAt: string
  sendType: SendType
}

interface FormErrors {
  title?: string
  content?: string
  recipientRoles?: string
  scheduleAt?: string
}

const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const getTodayDateTime = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    recipientRoles: [],
    scheduleAt: getTodayDateTime(),
    sendType: 'schedule',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        content: '',
        recipientRoles: [],
        scheduleAt: getTodayDateTime(),
        sendType: 'schedule',
      })
      setErrors({})
    }
  }, [open])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Vui lòng nhập nội dung'
    }

    if (formData.recipientRoles.length === 0) {
      newErrors.recipientRoles = 'Vui lòng chọn ít nhất một đối tượng nhận'
    }

    if (formData.sendType === 'schedule' && !formData.scheduleAt) {
      newErrors.scheduleAt = 'Vui lòng chọn thời gian lên lịch'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit({
        title: formData.title.trim(),
        content: formData.content.trim(),
        recipientRoles: formData.recipientRoles,
        scheduleAt: formData.scheduleAt,
        type: 'POLICY_UPDATE',
        sendType: formData.sendType,
      })
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const toggleRecipientRole = (role: string) => {
    setFormData((prev) => {
      const newRoles = prev.recipientRoles.includes(role)
        ? prev.recipientRoles.filter((r) => r !== role)
        : [...prev.recipientRoles, role]
      return { ...prev, recipientRoles: newRoles }
    })
    if (errors.recipientRoles) {
      setErrors({ ...errors, recipientRoles: undefined })
    }
  }

  const roleOptions = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'OPERATOR', label: 'Operator' },
    { value: 'DRIVER', label: 'Tài xế' },
  ]

  return (
    <CustomModal open={open} onClose={onClose} title="Tạo thông báo mới" width={700} footer={null}>
      <div className="create-promotion-modal-content">
        <div className="create-promotion-form">
          <div className="create-promotion-form-group">
            <label className="create-promotion-label">
              Tiêu đề <span className="create-promotion-required">*</span>
            </label>
            <input
              type="text"
              className={`create-promotion-input ${errors.title ? 'error' : ''}`}
              placeholder="Nhập tiêu đề thông báo"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                if (errors.title) setErrors({ ...errors, title: undefined })
              }}
            />
            {errors.title && <span className="create-promotion-error">{errors.title}</span>}
          </div>

          <div className="create-promotion-form-group">
            <label className="create-promotion-label">
              Nội dung <span className="create-promotion-required">*</span>
            </label>
            <textarea
              className={`create-promotion-textarea ${errors.content ? 'error' : ''}`}
              rows={6}
              placeholder="Nhập nội dung thông báo"
              value={formData.content}
              onChange={(e) => {
                setFormData({ ...formData, content: e.target.value })
                if (errors.content) setErrors({ ...errors, content: undefined })
              }}
            />
            {errors.content && <span className="create-promotion-error">{errors.content}</span>}
          </div>

          <div className="create-promotion-form-group">
            <label className="create-promotion-label">
              Đối tượng nhận <span className="create-promotion-required">*</span>
            </label>
            <div className="announcement-recipients-selection">
              {roleOptions.map((option) => (
                <label key={option.value} className="announcement-recipient-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.recipientRoles.includes(option.value)}
                    onChange={() => toggleRecipientRole(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.recipientRoles && (
              <span className="create-promotion-error">{errors.recipientRoles}</span>
            )}
          </div>

          <div className="create-promotion-form-group">
            <label className="create-promotion-label">
              Gửi thông báo <span className="create-promotion-required">*</span>
            </label>
            <div className="announcement-send-type-selection">
              <label className="announcement-send-type-option">
                <input
                  type="radio"
                  name="sendType"
                  value="now"
                  checked={formData.sendType === 'now'}
                  onChange={(e) => {
                    setFormData({ ...formData, sendType: e.target.value as SendType })
                    if (errors.scheduleAt) setErrors({ ...errors, scheduleAt: undefined })
                  }}
                />
                <span>Gửi ngay</span>
              </label>
              <label className="announcement-send-type-option">
                <input
                  type="radio"
                  name="sendType"
                  value="schedule"
                  checked={formData.sendType === 'schedule'}
                  onChange={(e) => {
                    setFormData({ ...formData, sendType: e.target.value as SendType })
                  }}
                />
                <span>Lên lịch</span>
              </label>
            </div>
          </div>

          <div className="create-promotion-form-group">
            <label className="create-promotion-label">
              Thời gian lên lịch{' '}
              {formData.sendType === 'schedule' && (
                <span className="create-promotion-required">*</span>
              )}
            </label>
            <input
              type="datetime-local"
              className={`create-promotion-date-input ${errors.scheduleAt ? 'error' : ''}`}
              value={formData.scheduleAt}
              disabled={formData.sendType === 'now'}
              onChange={(e) => {
                setFormData({ ...formData, scheduleAt: e.target.value })
                if (errors.scheduleAt) setErrors({ ...errors, scheduleAt: undefined })
              }}
            />
            {errors.scheduleAt && (
              <span className="create-promotion-error">{errors.scheduleAt}</span>
            )}
          </div>

          <div className="create-promotion-form-actions">
            <button
              type="button"
              className="create-promotion-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="create-promotion-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : formData.sendType === 'now' ? 'Gửi ngay' : 'Lên lịch'}
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreateAnnouncementModal
