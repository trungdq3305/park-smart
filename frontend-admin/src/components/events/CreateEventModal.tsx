import { useEffect, useState } from 'react'
import { message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCreateEventMutation } from '../../features/admin/eventAPI'
import { CustomModal } from '../common'
import { getParkingLotId } from '../../utils/parkingLotId'
import '../promotions/CreatePromotionModal.css'
import { useOperatorId } from '../../hooks/useOperatorId'

interface CreateEventModalProps {
  open: boolean
  onClose: () => void
}

interface FormData {
  title: string
  description: string
  location: string
  startDate: Dayjs | null
  endDate: Dayjs | null
  includedPromotions: boolean
}

interface FormErrors {
  title?: string
  location?: string
  startDate?: string
  endDate?: string
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ open, onClose }) => {
  const operatorId = useOperatorId()
  const [createEvent, { isLoading }] = useCreateEventMutation()

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    startDate: null,
    endDate: null,
    includedPromotions: false,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        description: '',
        location: '',
        startDate: null,
        endDate: null,
        includedPromotions: false,
      })
      setErrors({})
    }
  }, [open])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tên sự kiện'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Vui lòng nhập địa điểm'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu'
    } else if (formData.startDate.isBefore(dayjs().startOf('day'))) {
      newErrors.startDate = 'Ngày bắt đầu không được là quá khứ'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc'
    } else if (formData.startDate && formData.endDate.isBefore(formData.startDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
    } else if (
      formData.startDate &&
      formData.endDate.isSame(formData.startDate, 'day') &&
      formData.endDate.isBefore(formData.startDate)
    ) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    const parkingLotId = getParkingLotId()

    if (!parkingLotId) {
      message.error('Không tìm thấy thông tin bãi đỗ xe')
      return
    }

    try {
      const eventData = {
        operatorId,
        title: formData.title.trim(),
        description: formData.description.trim() || '',
        startDate: formData.startDate!.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        endDate: formData.endDate!.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        location: formData.location.trim() || '',
        includedPromotions: formData.includedPromotions || false,
        parkingLotId,
      }

      await createEvent(eventData).unwrap()
      message.success('Tạo sự kiện thành công')
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Tạo sự kiện thất bại')
    }
  }

  const getMinStartDate = (): string => {
    return dayjs().format('YYYY-MM-DD')
  }

  const getMinEndDate = (): string => {
    if (formData.startDate) {
      return formData.startDate.format('YYYY-MM-DD')
    }
    return dayjs().format('YYYY-MM-DD')
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Tạo mới sự kiện"
      width={600}
      loading={isLoading}
      footer={
        <div className="create-promotion-modal-footer">
          <button
            type="button"
            className="create-promotion-btn create-promotion-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="button"
            className="create-promotion-btn create-promotion-btn-submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo mới'}
          </button>
        </div>
      }
    >
      <div className="create-promotion-form">
        {/* Title */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Tên sự kiện <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.title ? 'error' : ''}`}
            placeholder="Nhập tên sự kiện"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value })
              if (errors.title) setErrors({ ...errors, title: undefined })
            }}
          />
          {errors.title && <span className="create-promotion-error">{errors.title}</span>}
        </div>

        {/* Description */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Mô tả
            <span className="create-promotion-tooltip" title="Tối đa 500 ký tự">
              ℹ️
            </span>
          </label>
          <textarea
            className="create-promotion-textarea"
            rows={4}
            placeholder="Nhập mô tả sự kiện"
            maxLength={500}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="create-promotion-char-count">
            {formData.description.length} / 500 ký tự
          </div>
        </div>

        {/* Location */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Địa điểm <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.location ? 'error' : ''}`}
            placeholder="Nhập địa điểm tổ chức sự kiện"
            value={formData.location}
            onChange={(e) => {
              setFormData({ ...formData, location: e.target.value })
              if (errors.location) setErrors({ ...errors, location: undefined })
            }}
          />
          {errors.location && <span className="create-promotion-error">{errors.location}</span>}
        </div>

        {/* Start Date */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Ngày bắt đầu <span className="create-promotion-required">*</span>
          </label>
          <div className="create-promotion-datetime-wrapper">
            <input
              type="date"
              className={`create-promotion-date-input ${errors.startDate ? 'error' : ''}`}
              value={formData.startDate ? formData.startDate.format('YYYY-MM-DD') : ''}
              min={getMinStartDate()}
              onChange={(e) => {
                if (e.target.value) {
                  const currentDate = formData.startDate || dayjs()
                  const newDate = dayjs(e.target.value)
                    .hour(currentDate.hour())
                    .minute(currentDate.minute())
                    .second(0)
                    .millisecond(0)
                  setFormData({ ...formData, startDate: newDate })
                  if (errors.startDate) setErrors({ ...errors, startDate: undefined })
                }
              }}
            />
            <input
              type="time"
              className="create-promotion-time-input"
              value={
                formData.startDate ? formData.startDate.format('HH:mm') : dayjs().format('HH:mm')
              }
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':')
                const baseDate = formData.startDate || dayjs().startOf('day')
                const newDate = baseDate
                  .hour(parseInt(hours, 10))
                  .minute(parseInt(minutes, 10))
                  .second(0)
                  .millisecond(0)
                setFormData({ ...formData, startDate: newDate })
                if (errors.startDate) setErrors({ ...errors, startDate: undefined })
              }}
            />
          </div>
          {errors.startDate && <span className="create-promotion-error">{errors.startDate}</span>}
        </div>

        {/* End Date */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Ngày kết thúc <span className="create-promotion-required">*</span>
          </label>
          <div className="create-promotion-datetime-wrapper">
            <input
              type="date"
              className={`create-promotion-date-input ${errors.endDate ? 'error' : ''}`}
              value={formData.endDate ? formData.endDate.format('YYYY-MM-DD') : ''}
              min={getMinEndDate()}
              onChange={(e) => {
                if (e.target.value) {
                  const currentDate = formData.endDate || dayjs()
                  const newDate = dayjs(e.target.value)
                    .hour(currentDate.hour())
                    .minute(currentDate.minute())
                    .second(0)
                    .millisecond(0)
                  setFormData({ ...formData, endDate: newDate })
                  if (errors.endDate) setErrors({ ...errors, endDate: undefined })
                }
              }}
            />
            <input
              type="time"
              className="create-promotion-time-input"
              value={formData.endDate ? formData.endDate.format('HH:mm') : dayjs().format('HH:mm')}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':')
                const baseDate = formData.endDate || dayjs().startOf('day')
                const newDate = baseDate
                  .hour(parseInt(hours, 10))
                  .minute(parseInt(minutes, 10))
                  .second(0)
                  .millisecond(0)
                setFormData({ ...formData, endDate: newDate })
                if (errors.endDate) setErrors({ ...errors, endDate: undefined })
              }}
            />
          </div>
          {errors.endDate && <span className="create-promotion-error">{errors.endDate}</span>}
        </div>

        {/* Included Promotions */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">Bao gồm khuyến mãi</label>
          <div className="create-promotion-switch-wrapper">
            <label className="create-promotion-switch">
              <input
                type="checkbox"
                checked={formData.includedPromotions}
                onChange={(e) => setFormData({ ...formData, includedPromotions: e.target.checked })}
              />
              <span className="create-promotion-switch-slider">
                <span className="create-promotion-switch-label">
                  {formData.includedPromotions ? 'Có' : 'Không'}
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreateEventModal
