import { useEffect, useState } from 'react'
import { message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useUpdatePromotionMutation } from '../../features/operator/promotionAPI'
import { CustomModal } from '../common'
import type { Promotion } from '../../types/Promotion'
import './CreatePromotionModal.css'

interface UpdatePromotionModalProps {
  open: boolean
  onClose: () => void
  promotion: Promotion | null
}

interface FormData {
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
  name?: string
  discountType?: string
  discountValue?: string
  startDate?: string
  endDate?: string
}

const UpdatePromotionModal: React.FC<UpdatePromotionModalProps> = ({
  open,
  onClose,
  promotion,
}) => {
  const [updatePromotion, { isLoading }] = useUpdatePromotionMutation()

  const [formData, setFormData] = useState<FormData>({
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
  const [showDiscountTypeDropdown, setShowDiscountTypeDropdown] = useState(false)

  useEffect(() => {
    if (open && promotion) {
      // Handle different discountType formats from API
      let discountType: 'Percentage' | 'FixedAmount' = 'Percentage'
      if (promotion.discountType === 'PERCENTAGE' || promotion.discountType === 'Percentage') {
        discountType = 'Percentage'
      } else if (
        promotion.discountType === 'FIXED_AMOUNT' ||
        promotion.discountType === 'FixedAmount'
      ) {
        discountType = 'FixedAmount'
      }
      
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        discountType: discountType,
        discountValue: promotion.discountValue,
        maxDiscountAmount: promotion.maxDiscountAmount || 0,
        startDate: dayjs(promotion.startDate),
        endDate: dayjs(promotion.endDate),
        totalUsageLimit: promotion.totalUsageLimit || 10,
        isActive: promotion.isActive !== undefined ? promotion.isActive : true,
      })
      setErrors({})
    }
  }, [open, promotion])

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
    } else {
      // Cho phép chọn ngày trong quá khứ nếu đó là ngày bắt đầu hiện tại của promotion
      if (promotion?.startDate) {
        const promotionStartDate = dayjs(promotion.startDate).startOf('day')
        if (formData.startDate.isBefore(promotionStartDate)) {
          newErrors.startDate = 'Ngày bắt đầu không được sớm hơn ngày hiện tại của khuyến mãi'
        }
      } else if (formData.startDate.isBefore(dayjs().startOf('day'))) {
        newErrors.startDate = 'Ngày bắt đầu không được là quá khứ'
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc'
    } else {
      if (formData.startDate && formData.endDate.isBefore(formData.startDate)) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
      } else if (promotion?.endDate) {
        const promotionEndDate = dayjs(promotion.endDate).startOf('day')
        if (formData.endDate.isBefore(promotionEndDate) && formData.startDate) {
          const promotionStartDate = dayjs(promotion.startDate).startOf('day')
          if (formData.startDate.isBefore(promotionStartDate)) {
            newErrors.endDate = 'Ngày kết thúc không được sớm hơn ngày hiện tại của khuyến mãi'
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!promotion?._id) {
      message.error('Không tìm thấy thông tin khuyến mãi')
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      const promotionData = {
        id: promotion._id,
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

      await updatePromotion(promotionData).unwrap()
      message.success('Cập nhật khuyến mãi thành công')
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Cập nhật khuyến mãi thất bại')
    }
  }

  const getMinStartDate = (): string => {
    if (promotion?.startDate) {
      return dayjs(promotion.startDate).format('YYYY-MM-DD')
    }
    return dayjs().format('YYYY-MM-DD')
  }

  const getMinEndDate = (): string => {
    if (formData.startDate) {
      return formData.startDate.format('YYYY-MM-DD')
    }
    if (promotion?.endDate) {
      return dayjs(promotion.endDate).format('YYYY-MM-DD')
    }
    return dayjs().format('YYYY-MM-DD')
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa khuyến mãi"
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
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      }
    >
      <div className="create-promotion-form">
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
                        setFormData({ ...formData, discountType: 'Percentage' })
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
                        setFormData({ ...formData, discountType: 'FixedAmount' })
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

export default UpdatePromotionModal
