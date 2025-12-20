import React, { useState, useEffect } from 'react'
import { CustomModal } from '../common'
import type { SubscriptionPlan } from '../../types/Subscription'
import './SubscriptionPlanDisplay.css'

interface EditSubscriptionPlanModalProps {
  open: boolean
  onClose: () => void
  plan: SubscriptionPlan | null
  onSubmit: (formData: {
    name: string
    description: string
    monthlyFeeAmount: number
    billingDayOfMonth: number
    gracePeriodDays: number
    penaltyFeeAmount: number
    maxOverdueMonthsBeforeSuspension: number
    isActive: boolean
  }) => Promise<void>
  isLoading?: boolean
}

const EditSubscriptionPlanModal: React.FC<EditSubscriptionPlanModalProps> = ({
  open,
  onClose,
  plan,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyFeeAmount: 0,
    billingDayOfMonth: 28,
    gracePeriodDays: 31,
    penaltyFeeAmount: 0,
    maxOverdueMonthsBeforeSuspension: 12,
    isActive: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (plan && open) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        monthlyFeeAmount: plan.monthlyFeeAmount || 0,
        billingDayOfMonth: plan.billingDayOfMonth || 28,
        gracePeriodDays: plan.gracePeriodDays || 31,
        penaltyFeeAmount: plan.penaltyFeeAmount || 0,
        maxOverdueMonthsBeforeSuspension: plan.maxOverdueMonthsBeforeSuspension || 12,
        isActive: plan.isActive !== undefined ? plan.isActive : true,
      })
      setErrors({})
    }
  }, [plan, open])

  const formatCurrencyInput = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  const parseCurrencyInput = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên gói đăng ký'
    }

    if (formData.monthlyFeeAmount < 0) {
      newErrors.monthlyFeeAmount = 'Phí hàng tháng không được âm'
    }

    if (formData.penaltyFeeAmount < 0) {
      newErrors.penaltyFeeAmount = 'Phí phạt không được âm'
    }

    if (formData.billingDayOfMonth < 1 || formData.billingDayOfMonth > 28) {
      newErrors.billingDayOfMonth = 'Ngày thanh toán phải từ 1 đến 28'
    }

    if (formData.gracePeriodDays < 0) {
      newErrors.gracePeriodDays = 'Thời gian gia hạn không được âm'
    }

    if (formData.maxOverdueMonthsBeforeSuspension < 0) {
      newErrors.maxOverdueMonthsBeforeSuspension = 'Số tháng quá hạn không được âm'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      setToast({ type: 'success', message: 'Cập nhật gói đăng ký thành công!' })
      setTimeout(() => {
        setToast(null)
        onClose()
      }, 2000)
    } catch (error: any) {
      setToast({
        type: 'error',
        message: error?.data?.message || 'Cập nhật gói đăng ký thất bại',
      })
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <>
      <CustomModal open={open} onClose={onClose} title="Chỉnh sửa Gói Đăng Ký">
        <div className="sub-plan-edit-modal">
          <div className="sub-plan-form-group">
            <label className="sub-plan-form-label">
              Tên gói đăng ký <span className="sub-plan-required">*</span>
            </label>
            <input
              type="text"
              className={`sub-plan-form-input ${errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: '' })
              }}
              placeholder="Nhập tên gói đăng ký"
            />
            {errors.name && <span className="sub-plan-form-error">{errors.name}</span>}
          </div>

          <div className="sub-plan-form-group">
            <label className="sub-plan-form-label">Mô tả</label>
            <textarea
              className="sub-plan-form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập mô tả gói đăng ký"
              rows={3}
            />
          </div>

          <div className="sub-plan-form-row">
            <div className="sub-plan-form-group">
              <label className="sub-plan-form-label">
                Phí hàng tháng (VND) <span className="sub-plan-required">*</span>
              </label>
              <input
                type="text"
                className={`sub-plan-form-input ${errors.monthlyFeeAmount ? 'error' : ''}`}
                value={formatCurrencyInput(formData.monthlyFeeAmount)}
                onChange={(e) => {
                  const value = parseCurrencyInput(e.target.value)
                  setFormData({ ...formData, monthlyFeeAmount: value })
                  if (errors.monthlyFeeAmount) setErrors({ ...errors, monthlyFeeAmount: '' })
                }}
                placeholder="0"
              />
              {errors.monthlyFeeAmount && (
                <span className="sub-plan-form-error">{errors.monthlyFeeAmount}</span>
              )}
            </div>

            <div className="sub-plan-form-group">
              <label className="sub-plan-form-label">
                Phí phạt (VND) <span className="sub-plan-required">*</span>
              </label>
              <input
                type="text"
                className={`sub-plan-form-input ${errors.penaltyFeeAmount ? 'error' : ''}`}
                value={formatCurrencyInput(formData.penaltyFeeAmount)}
                onChange={(e) => {
                  const value = parseCurrencyInput(e.target.value)
                  setFormData({ ...formData, penaltyFeeAmount: value })
                  if (errors.penaltyFeeAmount) setErrors({ ...errors, penaltyFeeAmount: '' })
                }}
                placeholder="0"
              />
              {errors.penaltyFeeAmount && (
                <span className="sub-plan-form-error">{errors.penaltyFeeAmount}</span>
              )}
            </div>
          </div>

          <div className="sub-plan-form-row">
            <div className="sub-plan-form-group">
              <label className="sub-plan-form-label">
                Ngày thanh toán trong tháng <span className="sub-plan-required">*</span>
              </label>
              <input
                type="number"
                className={`sub-plan-form-input ${errors.billingDayOfMonth ? 'error' : ''}`}
                value={formData.billingDayOfMonth}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 0
                  setFormData({ ...formData, billingDayOfMonth: value })
                  if (errors.billingDayOfMonth) setErrors({ ...errors, billingDayOfMonth: '' })
                }}
                min="1"
                max="28"
                placeholder="28"
              />
              {errors.billingDayOfMonth && (
                <span className="sub-plan-form-error">{errors.billingDayOfMonth}</span>
              )}
            </div>

            <div className="sub-plan-form-group">
              <label className="sub-plan-form-label">
                Thời gian gia hạn (ngày) <span className="sub-plan-required">*</span>
              </label>
              <input
                type="number"
                className={`sub-plan-form-input ${errors.gracePeriodDays ? 'error' : ''}`}
                value={formData.gracePeriodDays}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 0
                  setFormData({ ...formData, gracePeriodDays: value })
                  if (errors.gracePeriodDays) setErrors({ ...errors, gracePeriodDays: '' })
                }}
                min="0"
                placeholder="31"
              />
              {errors.gracePeriodDays && (
                <span className="sub-plan-form-error">{errors.gracePeriodDays}</span>
              )}
            </div>
          </div>

          <div className="sub-plan-form-group">
            <label className="sub-plan-form-label">
              Số tháng quá hạn trước khi tạm ngưng <span className="sub-plan-required">*</span>
            </label>
            <input
              type="number"
              className={`sub-plan-form-input ${errors.maxOverdueMonthsBeforeSuspension ? 'error' : ''}`}
              value={formData.maxOverdueMonthsBeforeSuspension}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0
                setFormData({ ...formData, maxOverdueMonthsBeforeSuspension: value })
                if (errors.maxOverdueMonthsBeforeSuspension)
                  setErrors({ ...errors, maxOverdueMonthsBeforeSuspension: '' })
              }}
              min="0"
              placeholder="12"
            />
            {errors.maxOverdueMonthsBeforeSuspension && (
              <span className="sub-plan-form-error">{errors.maxOverdueMonthsBeforeSuspension}</span>
            )}
          </div>

          <div className="sub-plan-form-group">
            <label className="sub-plan-form-label">Trạng thái</label>
            <div className="sub-plan-toggle-wrapper">
              <label className="sub-plan-toggle">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="sub-plan-toggle-slider"></span>
              </label>
              <span className="sub-plan-toggle-label">
                {formData.isActive ? 'Đang hoạt động' : 'Đã vô hiệu'}
              </span>
            </div>
          </div>

          <div className="sub-plan-form-actions">
            <button className="sub-plan-form-btn cancel" onClick={onClose} disabled={isLoading}>
              Hủy
            </button>
            <button
              className="sub-plan-form-btn submit"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Toast */}
      {toast && (
        <div className={`sub-plan-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}
    </>
  )
}

export default EditSubscriptionPlanModal
