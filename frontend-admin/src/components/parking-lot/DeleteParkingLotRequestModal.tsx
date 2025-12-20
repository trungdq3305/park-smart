import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CustomModal } from '../common'
import '../promotions/CreatePromotionModal.css'
import './DeleteParkingLotRequestModal.css'

interface DeleteParkingLotRequestModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (effectiveDate: string) => Promise<void>
  loading?: boolean
}

interface FormErrors {
  effectiveDate?: string
}

const DeleteParkingLotRequestModal: React.FC<DeleteParkingLotRequestModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [effectiveDate, setEffectiveDate] = useState<Dayjs | null>(dayjs().add(7, 'day'))
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setEffectiveDate(dayjs().add(7, 'day'))
      setErrors({})
    }
  }, [open])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!effectiveDate) {
      newErrors.effectiveDate = 'Vui lòng chọn ngày hiệu lực'
    } else if (effectiveDate.isBefore(dayjs().startOf('day'))) {
      newErrors.effectiveDate = 'Ngày hiệu lực không được là quá khứ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !effectiveDate) {
      return
    }

    try {
      // Format date to ISO string
      const formattedDate = effectiveDate.toISOString()
      await onSubmit(formattedDate)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      title="Yêu cầu xóa bãi đỗ xe"
      width={600}
      footer={null}
    >
      <div className="create-promotion-modal-content">
        <div className="create-promotion-form">
          <div className="create-promotion-form-group">
            <label className="create-promotion-label">
              Ngày hiệu lực <span className="create-promotion-required">*</span>
            </label>
            <p className="create-promotion-tooltip">
              Ngày mà yêu cầu xóa bãi đỗ xe sẽ có hiệu lực. Phải là ngày trong tương lai.
            </p>
            <input
              type="date"
              className={`create-promotion-date-input ${errors.effectiveDate ? 'error' : ''}`}
              value={effectiveDate ? effectiveDate.format('YYYY-MM-DD') : ''}
              min={dayjs().add(1, 'day').format('YYYY-MM-DD')}
              onChange={(e) => {
                const newDate = e.target.value ? dayjs(e.target.value) : null
                setEffectiveDate(newDate)
                if (errors.effectiveDate) setErrors({ ...errors, effectiveDate: undefined })
              }}
            />
            {errors.effectiveDate && (
              <span className="create-promotion-error">{errors.effectiveDate}</span>
            )}
          </div>

          <div className="delete-parking-lot-form-actions">
            <button
              type="button"
              className="delete-parking-lot-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="delete-parking-lot-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default DeleteParkingLotRequestModal
