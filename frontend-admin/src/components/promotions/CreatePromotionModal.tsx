import { useEffect, useState } from 'react'
import { message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCreatePromotionMutation } from '../../features/operator/promotionAPI'
import { useGetEventsByOperatorQuery } from '../../features/admin/eventAPI'
import { CustomModal } from '../common'
import type { Event } from '../../types/Event'
import './CreatePromotionModal.css'

interface CreatePromotionModalProps {
  open: boolean
  onClose: () => void
}

interface FormData {
  eventId?: string
  code: string
  name: string
  description: string
  discountType: 'Percentage' | 'FixedAmount'
  discountValue: number
  maxDiscountAmount: number
  startDate: Dayjs | null
  endDate: Dayjs | null
  totalUsageLimit: number
  isActive: boolean
}

interface FormErrors {
  eventId?: string
  code?: string
  name?: string
  discountType?: string
  discountValue?: string
  startDate?: string
  endDate?: string
}

const CreatePromotionModal: React.FC<CreatePromotionModalProps> = ({ open, onClose }) => {
  const [createPromotion, { isLoading }] = useCreatePromotionMutation()
  const { data: eventsData } = useGetEventsByOperatorQuery({})
  const events: Event[] = Array.isArray(eventsData)
    ? eventsData
    : (eventsData as { data?: Event[] })?.data || []

  const [formData, setFormData] = useState<FormData>({
    eventId: undefined,
    code: '',
    name: '',
    description: '',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmount: 100000,
    startDate: null,
    endDate: null,
    totalUsageLimit: 10,
    isActive: true,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showEventDropdown, setShowEventDropdown] = useState(false)
  const [showDiscountTypeDropdown, setShowDiscountTypeDropdown] = useState(false)
  const [eventSearch, setEventSearch] = useState('')

  useEffect(() => {
    if (open) {
      setFormData({
        eventId: undefined,
        code: '',
        name: '',
        description: '',
        discountType: 'Percentage',
        discountValue: 10,
        maxDiscountAmount: 100000,
        startDate: null,
        endDate: null,
        totalUsageLimit: 10,
        isActive: true,
      })
      setErrors({})
      setEventSearch('')
    }
  }, [open])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }

  const formatPercentage = (value: number): string => {
    return `${value}%`
  }

  const parsePercentage = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.eventId) {
      newErrors.eventId = 'Vui lòng chọn sự kiện'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Vui lòng nhập mã khuyến mãi'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên khuyến mãi'
    }

    if (!formData.discountType) {
      newErrors.discountType = 'Vui lòng chọn loại giảm giá'
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'Vui lòng nhập giá trị giảm giá hợp lệ'
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const promotionData = {
        eventId: formData.eventId!,
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxDiscountAmount: formData.maxDiscountAmount || 0,
        startDate: formData.startDate!.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        endDate: formData.endDate!.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        totalUsageLimit: formData.totalUsageLimit || 10,
        isActive: formData.isActive,
      }

      await createPromotion(promotionData).unwrap()
      message.success('Tạo khuyến mãi thành công')
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Tạo khuyến mãi thất bại')
    }
  }

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(eventSearch.toLowerCase())
  )

  const selectedEvent = events.find((e) => e._id === formData.eventId)

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Tạo mới khuyến mãi"
      width={700}
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
        {/* Event Selection */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Sự kiện <span className="create-promotion-required">*</span>
          </label>
          <div className="create-promotion-select-wrapper">
            <div
              className={`create-promotion-select ${errors.eventId ? 'error' : ''}`}
              onClick={() => setShowEventDropdown(!showEventDropdown)}
            >
              <span className={selectedEvent ? '' : 'create-promotion-placeholder'}>
                {selectedEvent ? selectedEvent.title : 'Chọn sự kiện'}
              </span>
              <span className="create-promotion-select-arrow">▼</span>
            </div>
            {showEventDropdown && (
              <>
                <div
                  className="create-promotion-dropdown-backdrop"
                  onClick={() => setShowEventDropdown(false)}
                />
                <div className="create-promotion-dropdown">
                  <div className="create-promotion-search-wrapper">
                    <input
                      type="text"
                      className="create-promotion-search-input"
                      placeholder="Tìm kiếm sự kiện..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="create-promotion-options">
                    {filteredEvents.map((event) => (
                      <div
                        key={event._id}
                        className={`create-promotion-option ${
                          formData.eventId === event._id ? 'selected' : ''
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, eventId: event._id })
                          setShowEventDropdown(false)
                          if (errors.eventId) setErrors({ ...errors, eventId: undefined })
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {errors.eventId && <span className="create-promotion-error">{errors.eventId}</span>}
        </div>

        {/* Code */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Mã khuyến mãi <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.code ? 'error' : ''}`}
            placeholder="Nhập mã khuyến mãi"
            value={formData.code}
            onChange={(e) => {
              setFormData({ ...formData, code: e.target.value })
              if (errors.code) setErrors({ ...errors, code: undefined })
            }}
          />
          {errors.code && <span className="create-promotion-error">{errors.code}</span>}
        </div>

        {/* Name */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Tên khuyến mãi <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.name ? 'error' : ''}`}
            placeholder="Nhập tên khuyến mãi"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (errors.name) setErrors({ ...errors, name: undefined })
            }}
          />
          {errors.name && <span className="create-promotion-error">{errors.name}</span>}
        </div>

        {/* Description */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">Mô tả</label>
          <textarea
            className="create-promotion-textarea"
            rows={3}
            placeholder="Nhập mô tả khuyến mãi"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Discount Type */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Loại giảm giá <span className="create-promotion-required">*</span>
          </label>
          <div className="create-promotion-select-wrapper">
            <div
              className={`create-promotion-select ${errors.discountType ? 'error' : ''}`}
              onClick={() => setShowDiscountTypeDropdown(!showDiscountTypeDropdown)}
            >
              <span>
                {formData.discountType === 'Percentage'
                  ? 'Phần trăm (%)'
                  : 'Số tiền cố định (VND)'}
              </span>
              <span className="create-promotion-select-arrow">▼</span>
            </div>
            {showDiscountTypeDropdown && (
              <>
                <div
                  className="create-promotion-dropdown-backdrop"
                  onClick={() => setShowDiscountTypeDropdown(false)}
                />
                <div className="create-promotion-dropdown">
                  <div className="create-promotion-options">
                    <div
                      className={`create-promotion-option ${
                        formData.discountType === 'Percentage' ? 'selected' : ''
                      }`}
                      onClick={() => {
                        setFormData({ ...formData, discountType: 'Percentage', discountValue: 10 })
                        setShowDiscountTypeDropdown(false)
                      }}
                    >
                      Phần trăm (%)
                    </div>
                    <div
                      className={`create-promotion-option ${
                        formData.discountType === 'FixedAmount' ? 'selected' : ''
                      }`}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          discountType: 'FixedAmount',
                          discountValue: 10000,
                        })
                        setShowDiscountTypeDropdown(false)
                      }}
                    >
                      Số tiền cố định (VND)
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {errors.discountType && (
            <span className="create-promotion-error">{errors.discountType}</span>
          )}
        </div>

        {/* Discount Value */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            {formData.discountType === 'Percentage'
              ? 'Phần trăm giảm giá'
              : 'Giá trị giảm giá (VND)'}{' '}
            <span className="create-promotion-required">*</span>
          </label>
          <div className="create-promotion-input-wrapper">
            <input
              type="text"
              className={`create-promotion-input ${errors.discountValue ? 'error' : ''}`}
              placeholder={
                formData.discountType === 'Percentage'
                  ? 'Nhập phần trăm (ví dụ: 10)'
                  : 'Nhập số tiền giảm giá'
              }
              value={
                formData.discountType === 'Percentage'
                  ? formData.discountValue
                    ? formatPercentage(formData.discountValue)
                    : ''
                  : formData.discountValue
                    ? formatCurrency(formData.discountValue)
                    : ''
              }
              onChange={(e) => {
                const value =
                  formData.discountType === 'Percentage'
                    ? parsePercentage(e.target.value)
                    : parseCurrency(e.target.value)
                setFormData({ ...formData, discountValue: value })
                if (errors.discountValue) setErrors({ ...errors, discountValue: undefined })
              }}
            />
            <span className="create-promotion-input-suffix">
              {formData.discountType === 'Percentage' ? '%' : '₫'}
            </span>
          </div>
          {errors.discountValue && (
            <span className="create-promotion-error">{errors.discountValue}</span>
          )}
        </div>

        {/* Max Discount Amount */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Giảm tối đa (VND)
            <span className="create-promotion-tooltip" title="Số tiền tối đa được giảm (0 = không giới hạn)">
              ℹ️
            </span>
          </label>
          <div className="create-promotion-input-wrapper">
            <input
              type="text"
              className="create-promotion-input"
              placeholder="Nhập số tiền giảm tối đa"
              value={formData.maxDiscountAmount ? formatCurrency(formData.maxDiscountAmount) : ''}
              onChange={(e) => {
                const value = parseCurrency(e.target.value)
                setFormData({ ...formData, maxDiscountAmount: value })
              }}
            />
            <span className="create-promotion-input-suffix">₫</span>
          </div>
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
              min={dayjs().format('YYYY-MM-DD')}
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
                formData.startDate
                  ? formData.startDate.format('HH:mm')
                  : dayjs().format('HH:mm')
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
              min={
                formData.startDate
                  ? formData.startDate.format('YYYY-MM-DD')
                  : dayjs().format('YYYY-MM-DD')
              }
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
              value={
                formData.endDate ? formData.endDate.format('HH:mm') : dayjs().format('HH:mm')
              }
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

        {/* Total Usage Limit */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Giới hạn sử dụng
            <span className="create-promotion-tooltip" title="Số lượt sử dụng tối đa">
              ℹ️
            </span>
          </label>
          <input
            type="text"
            className="create-promotion-input"
            placeholder="Nhập số lượt sử dụng tối đa"
            value={formData.totalUsageLimit ? formatCurrency(formData.totalUsageLimit) : ''}
            onChange={(e) => {
              const value = parseCurrency(e.target.value)
              setFormData({ ...formData, totalUsageLimit: value || 1 })
            }}
          />
        </div>

        {/* Is Active */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">Trạng thái</label>
          <div className="create-promotion-switch-wrapper">
            <label className="create-promotion-switch">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span className="create-promotion-switch-slider">
                <span className="create-promotion-switch-label">
                  {formData.isActive ? 'Hoạt động' : 'Vô hiệu'}
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}

export default CreatePromotionModal
