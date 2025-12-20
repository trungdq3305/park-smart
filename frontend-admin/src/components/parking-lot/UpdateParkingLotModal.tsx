import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { ParkingLot } from '../../types/ParkingLot'
import { CustomModal } from '../common'
import '../promotions/CreatePromotionModal.css'

interface UpdateParkingLotModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: any) => Promise<void>
  parkingLot: ParkingLot | null
  loading?: boolean
}

interface FormData {
  name: string
  totalCapacityEachLevel: number
  totalLevel: number
  bookingSlotDurationHours: number
  bookableCapacity: number
  leasedCapacity: number
  walkInCapacity: number
  effectiveDate: Dayjs | null
  parkingLotOperatorId: string
}

interface FormErrors {
  name?: string
  effectiveDate?: string
  totalCapacityEachLevel?: string
  totalLevel?: string
  bookingSlotDurationHours?: string
  bookableCapacity?: string
  leasedCapacity?: string
  walkInCapacity?: string
}

const UpdateParkingLotModal: React.FC<UpdateParkingLotModalProps> = ({
  open,
  onCancel,
  onSubmit,
  parkingLot,
  loading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    totalCapacityEachLevel: 0,
    totalLevel: 0,
    bookingSlotDurationHours: 0,
    bookableCapacity: 0,
    leasedCapacity: 0,
    walkInCapacity: 0,
    effectiveDate: null,
    parkingLotOperatorId: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open && parkingLot) {
      setFormData({
        name: parkingLot.name || '',
        totalCapacityEachLevel: parkingLot.totalCapacityEachLevel || 0,
        totalLevel: parkingLot.totalLevel || 0,
        bookingSlotDurationHours: parkingLot.bookingSlotDurationHours || 0,
        bookableCapacity: parkingLot.bookableCapacity || 0,
        leasedCapacity: parkingLot.leasedCapacity || 0,
        walkInCapacity: parkingLot.walkInCapacity || 0,
        effectiveDate: dayjs().add(7, 'day'), // Mặc định 7 ngày sau
        parkingLotOperatorId: parkingLot.parkingLotOperatorId || '',
      })
      setErrors({})
    }
  }, [open, parkingLot])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên bãi đỗ xe'
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Vui lòng chọn ngày hiệu lực'
    } else if (formData.effectiveDate.isBefore(dayjs().startOf('day'))) {
      newErrors.effectiveDate = 'Ngày hiệu lực không được là quá khứ'
    }

    if (!formData.totalCapacityEachLevel || formData.totalCapacityEachLevel < 1) {
      newErrors.totalCapacityEachLevel = 'Vui lòng nhập sức chứa mỗi tầng (tối thiểu 1)'
    }

    if (!formData.totalLevel || formData.totalLevel < 1) {
      newErrors.totalLevel = 'Vui lòng nhập tổng số tầng (tối thiểu 1)'
    }

    if (!formData.bookingSlotDurationHours || formData.bookingSlotDurationHours < 1) {
      newErrors.bookingSlotDurationHours = 'Vui lòng nhập thời lượng đặt chỗ (tối thiểu 1 giờ)'
    }

    if (formData.bookableCapacity === undefined || formData.bookableCapacity < 0) {
      newErrors.bookableCapacity = 'Vui lòng nhập sức chứa có thể đặt (tối thiểu 0)'
    }

    if (formData.leasedCapacity === undefined || formData.leasedCapacity < 0) {
      newErrors.leasedCapacity = 'Vui lòng nhập sức chứa cho thuê (tối thiểu 0)'
    }

    if (formData.walkInCapacity === undefined || formData.walkInCapacity < 0) {
      newErrors.walkInCapacity = 'Vui lòng nhập sức chứa khách vãng lai (tối thiểu 0)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      const submitValues = {
        name: formData.name.trim(),
        totalCapacityEachLevel: formData.totalCapacityEachLevel,
        totalLevel: formData.totalLevel,
        bookingSlotDurationHours: formData.bookingSlotDurationHours,
        bookableCapacity: formData.bookableCapacity,
        leasedCapacity: formData.leasedCapacity,
        walkInCapacity: formData.walkInCapacity,
        effectiveDate: formData.effectiveDate
          ? formData.effectiveDate.format('YYYY-MM-DD')
          : undefined,
        parkingLotOperatorId: formData.parkingLotOperatorId,
      }
      await onSubmit(submitValues)
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }

  const formatNumber = (value: number): string => {
    return value > 0 ? value.toString() : ''
  }

  return (
    <CustomModal
      open={open}
      onClose={onCancel}
      title="Gửi yêu cầu cập nhật bãi đỗ xe"
      width={600}
      loading={loading}
      footer={
        <div className="create-promotion-modal-footer">
          <button
            type="button"
            className="create-promotion-btn create-promotion-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="button"
            className="create-promotion-btn create-promotion-btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      }
    >
      <div className="create-promotion-form">
        {/* Name */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Tên bãi đỗ xe <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.name ? 'error' : ''}`}
            placeholder="Nhập tên bãi đỗ xe"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (errors.name) setErrors({ ...errors, name: undefined })
            }}
          />
          {errors.name && <span className="create-promotion-error">{errors.name}</span>}
        </div>

        {/* Effective Date */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Ngày hiệu lực <span className="create-promotion-required">*</span>
          </label>
          <input
            type="date"
            className={`create-promotion-date-input ${errors.effectiveDate ? 'error' : ''}`}
            value={formData.effectiveDate ? formData.effectiveDate.format('YYYY-MM-DD') : ''}
            min={dayjs().format('YYYY-MM-DD')}
            onChange={(e) => {
              if (e.target.value) {
                const newDate = dayjs(e.target.value)
                setFormData({ ...formData, effectiveDate: newDate })
                if (errors.effectiveDate) setErrors({ ...errors, effectiveDate: undefined })
              }
            }}
          />
          {errors.effectiveDate && (
            <span className="create-promotion-error">{errors.effectiveDate}</span>
          )}
        </div>

        {/* Total Capacity Each Level */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Sức chứa mỗi tầng <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.totalCapacityEachLevel ? 'error' : ''}`}
            placeholder="Nhập sức chứa mỗi tầng"
            value={formatNumber(formData.totalCapacityEachLevel)}
            onChange={(e) => {
              const value = parseNumber(e.target.value)
              setFormData({ ...formData, totalCapacityEachLevel: value })
              if (errors.totalCapacityEachLevel)
                setErrors({ ...errors, totalCapacityEachLevel: undefined })
            }}
          />
          {errors.totalCapacityEachLevel && (
            <span className="create-promotion-error">{errors.totalCapacityEachLevel}</span>
          )}
        </div>

        {/* Total Level */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Tổng số tầng <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.totalLevel ? 'error' : ''}`}
            placeholder="Nhập tổng số tầng"
            value={formatNumber(formData.totalLevel)}
            onChange={(e) => {
              const value = parseNumber(e.target.value)
              setFormData({ ...formData, totalLevel: value })
              if (errors.totalLevel) setErrors({ ...errors, totalLevel: undefined })
            }}
          />
          {errors.totalLevel && <span className="create-promotion-error">{errors.totalLevel}</span>}
        </div>

        {/* Booking Slot Duration Hours */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Thời lượng đặt chỗ (giờ) <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.bookingSlotDurationHours ? 'error' : ''}`}
            placeholder="Nhập thời lượng đặt chỗ"
            value={formatNumber(formData.bookingSlotDurationHours)}
            onChange={(e) => {
              const value = parseNumber(e.target.value)
              setFormData({ ...formData, bookingSlotDurationHours: value })
              if (errors.bookingSlotDurationHours)
                setErrors({ ...errors, bookingSlotDurationHours: undefined })
            }}
          />
          {errors.bookingSlotDurationHours && (
            <span className="create-promotion-error">{errors.bookingSlotDurationHours}</span>
          )}
        </div>

        {/* Bookable Capacity */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Sức chứa có thể đặt <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.bookableCapacity ? 'error' : ''}`}
            placeholder="Nhập sức chứa có thể đặt"
            value={formatNumber(formData.bookableCapacity)}
            onChange={(e) => {
              const value = parseNumber(e.target.value)
              setFormData({ ...formData, bookableCapacity: value })
              if (errors.bookableCapacity) setErrors({ ...errors, bookableCapacity: undefined })
            }}
          />
          {errors.bookableCapacity && (
            <span className="create-promotion-error">{errors.bookableCapacity}</span>
          )}
        </div>

        {/* Leased Capacity */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Sức chứa cho thuê <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.leasedCapacity ? 'error' : ''}`}
            placeholder="Nhập sức chứa cho thuê"
            value={formatNumber(formData.leasedCapacity)}
            onChange={(e) => {
              const value = parseNumber(e.target.value)
              setFormData({ ...formData, leasedCapacity: value })
              if (errors.leasedCapacity) setErrors({ ...errors, leasedCapacity: undefined })
            }}
          />
          {errors.leasedCapacity && (
            <span className="create-promotion-error">{errors.leasedCapacity}</span>
          )}
        </div>

        {/* Walk In Capacity */}
        <div className="create-promotion-form-group">
          <label className="create-promotion-label">
            Sức chứa khách vãng lai <span className="create-promotion-required">*</span>
          </label>
          <input
            type="text"
            className={`create-promotion-input ${errors.walkInCapacity ? 'error' : ''}`}
            placeholder="Nhập sức chứa khách vãng lai"
            value={formatNumber(formData.walkInCapacity)}
            onChange={(e) => {
              const value = parseNumber(e.target.value)
              setFormData({ ...formData, walkInCapacity: value })
              if (errors.walkInCapacity) setErrors({ ...errors, walkInCapacity: undefined })
            }}
          />
          {errors.walkInCapacity && (
            <span className="create-promotion-error">{errors.walkInCapacity}</span>
          )}
        </div>
      </div>
    </CustomModal>
  )
}

export default UpdateParkingLotModal
