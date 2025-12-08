import { useEffect, useState, useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CustomModal } from '../common'
import { useCreateAddressMutation } from '../../features/operator/addressAPI'
import { useGetWardQuery } from '../../features/operator/wardAPI'
import { useCreateParkingLotRequestMutation } from '../../features/admin/parkinglotAPI'
import LocationPickerMap from '../common/LocationPickerMap'
import type { Ward } from '../../types/Ward'
import '../promotions/CreatePromotionModal.css'

interface CreateParkingLotRequestModalProps {
  open: boolean
  onClose: () => void
  operatorId: string
}

interface FormData {
  wardId: string
  fullAddress: string
  latitude: number | null
  longitude: number | null
  name: string
  totalCapacityEachLevel: number
  totalLevel: number
  effectiveDate: Dayjs | null
  bookableCapacity: number
  leasedCapacity: number
  walkInCapacity: number
  bookingSlotDurationHours: number
}

interface FormErrors {
  wardId?: string
  fullAddress?: string
  latitude?: string
  longitude?: string
  name?: string
  totalCapacityEachLevel?: string
  totalLevel?: string
  effectiveDate?: string
  bookableCapacity?: string
  leasedCapacity?: string
  walkInCapacity?: string
  bookingSlotDurationHours?: string
}

const HO_CHI_MINH_BOUNDS = {
  lat: { min: 10.35, max: 11.25 },
  lng: { min: 106.3, max: 107.2 },
}

const HO_CHI_MINH_BOUNDS_RECT: [[number, number], [number, number]] = [
  [HO_CHI_MINH_BOUNDS.lat.min, HO_CHI_MINH_BOUNDS.lng.min],
  [HO_CHI_MINH_BOUNDS.lat.max, HO_CHI_MINH_BOUNDS.lng.max],
]

const isWithinHoChiMinh = (lat: number, lng: number) =>
  lat >= HO_CHI_MINH_BOUNDS.lat.min &&
  lat <= HO_CHI_MINH_BOUNDS.lat.max &&
  lng >= HO_CHI_MINH_BOUNDS.lng.min &&
  lng <= HO_CHI_MINH_BOUNDS.lng.max

const CreateParkingLotRequestModal: React.FC<CreateParkingLotRequestModalProps> = ({
  open,
  onClose,
  operatorId,
}) => {
  const [createAddress, { isLoading: isCreatingAddress }] = useCreateAddressMutation()
  const [createParkingLotRequest, { isLoading: isCreatingRequest }] = useCreateParkingLotRequestMutation()
  const { data: wards, isLoading: isLoadingWards } = useGetWardQuery({})
  const wardData = (wards?.data?.[0] as Ward[]) || []

  const [formData, setFormData] = useState<FormData>({
    wardId: '',
    fullAddress: '',
    latitude: null,
    longitude: null,
    name: '',
    totalCapacityEachLevel: 0,
    totalLevel: 0,
    effectiveDate: dayjs().add(7, 'day'),
    bookableCapacity: 0,
    leasedCapacity: 0,
    walkInCapacity: 0,
    bookingSlotDurationHours: 1,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showWardDropdown, setShowWardDropdown] = useState(false)
  const [wardSearch, setWardSearch] = useState('')

  useEffect(() => {
    if (open) {
      setFormData({
        wardId: '',
        fullAddress: '',
        latitude: null,
        longitude: null,
        name: '',
        totalCapacityEachLevel: 0,
        totalLevel: 0,
        effectiveDate: dayjs().add(7, 'day'),
        bookableCapacity: 0,
        leasedCapacity: 0,
        walkInCapacity: 0,
        bookingSlotDurationHours: 1,
      })
      setErrors({})
      setTempLocation(null)
      setShowWardDropdown(false)
      setWardSearch('')
    }
  }, [open])

  const selectedWard = useMemo(() => {
    return wardData.find((ward: Ward) => ward._id === formData.wardId)
  }, [formData.wardId, wardData])

  const filteredWards = useMemo(() => {
    if (!wardSearch.trim()) {
      return wardData
    }
    const searchLower = wardSearch.toLowerCase().trim()
    return wardData.filter((ward: Ward) =>
      ward.wardName.toLowerCase().includes(searchLower)
    )
  }, [wardSearch, wardData])

  const openLocationPicker = () => {
    if (formData.latitude && formData.longitude) {
      setTempLocation({ lat: formData.latitude, lng: formData.longitude })
    } else {
      setTempLocation(null)
    }
    setIsLocationModalOpen(true)
  }

  const handleLocationSelect = (coords: { lat: number; lng: number }) => {
    if (!isWithinHoChiMinh(coords.lat, coords.lng)) {
      setToast({
        type: 'error',
        message: 'Vui lòng chọn vị trí thuộc khu vực TP.HCM.',
      })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setTempLocation(coords)
  }

  const handleLocationConfirm = () => {
    if (tempLocation) {
      setFormData({
        ...formData,
        latitude: Number(tempLocation.lat.toFixed(6)),
        longitude: Number(tempLocation.lng.toFixed(6)),
      })
    }
    setIsLocationModalOpen(false)
    setTempLocation(null)
  }

  const handleLocationCancel = () => {
    setIsLocationModalOpen(false)
    setTempLocation(null)
  }

  const formLocation =
    formData.latitude !== null && formData.longitude !== null
      ? { lat: formData.latitude, lng: formData.longitude }
      : null
  const mapLocation = tempLocation ?? formLocation

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.wardId) {
      newErrors.wardId = 'Vui lòng chọn phường'
    }

    if (!formData.fullAddress.trim()) {
      newErrors.fullAddress = 'Vui lòng nhập địa chỉ đầy đủ'
    }

    if (formData.latitude === null || formData.longitude === null) {
      newErrors.latitude = 'Vui lòng chọn vị trí trên bản đồ'
    }

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

    if (formData.bookableCapacity < 0) {
      newErrors.bookableCapacity = 'Sức chứa booking không được âm'
    }

    if (formData.leasedCapacity < 0) {
      newErrors.leasedCapacity = 'Sức chứa thuê dài hạn không được âm'
    }

    if (formData.walkInCapacity < 0) {
      newErrors.walkInCapacity = 'Sức chứa khách vãng lai không được âm'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !operatorId) {
      return
    }

    try {
      // Step 1: Create Address
      const addressPayload = {
        wardId: formData.wardId,
        fullAddress: formData.fullAddress,
        latitude: formData.latitude,
        longitude: formData.longitude,
      }

      const createdAddress: any = await createAddress(addressPayload).unwrap()
      const addressId = createdAddress?.data?.[0]?._id || createdAddress?.data?._id

      if (!addressId) {
        throw new Error('Không thể lấy addressId sau khi tạo địa chỉ')
      }

      // Step 2: Create Parking Lot Request
      const parkingLotRequestPayload = {
        addressId,
        name: formData.name,
        totalCapacityEachLevel: formData.totalCapacityEachLevel,
        totalLevel: formData.totalLevel,
        effectiveDate: formData.effectiveDate?.format('YYYY-MM-DD') || null,
        bookableCapacity: formData.bookableCapacity,
        leasedCapacity: formData.leasedCapacity,
        walkInCapacity: formData.walkInCapacity,
        bookingSlotDurationHours: formData.bookingSlotDurationHours,
        parkingLotOperatorId: operatorId,
      }

      await createParkingLotRequest({ payload: parkingLotRequestPayload }).unwrap()

      setToast({ type: 'success', message: 'Gửi yêu cầu tạo bãi đỗ xe thành công!' })
      setTimeout(() => {
        setToast(null)
        onClose()
      }, 2000)
    } catch (error: any) {
      setToast({
        type: 'error',
        message: error?.data?.message || 'Gửi yêu cầu thất bại',
      })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const isLoading = isCreatingAddress || isCreatingRequest

  return (
    <>
      <CustomModal
        open={open}
        onClose={onClose}
        title="Tạo yêu cầu bãi đỗ xe mới"
        width={800}
      >
        <div className="create-promotion-form">
          {/* Address Section */}
          <div className="create-promotion-form-section">
            <h3 className="create-promotion-form-section-title">Thông tin địa chỉ</h3>

            <div className="create-promotion-form-group">
              <label className="create-promotion-label">
                Phường <span className="create-promotion-required">*</span>
              </label>
              <div className="create-promotion-select-wrapper">
                <div
                  className={`create-promotion-select ${errors.wardId ? 'error' : ''} ${
                    isLoadingWards ? 'disabled' : ''
                  }`}
                  onClick={() => !isLoadingWards && setShowWardDropdown(!showWardDropdown)}
                >
                  <span className={selectedWard ? '' : 'create-promotion-placeholder'}>
                    {selectedWard ? selectedWard.wardName : 'Chọn phường'}
                  </span>
                  <span className="create-promotion-select-arrow">▼</span>
                </div>
                {showWardDropdown && !isLoadingWards && (
                  <>
                    <div
                      className="create-promotion-dropdown-backdrop"
                      onClick={() => {
                        setShowWardDropdown(false)
                        setWardSearch('')
                      }}
                    />
                    <div className="create-promotion-dropdown">
                      <div className="create-promotion-search-wrapper">
                        <input
                          type="text"
                          className="create-promotion-search-input"
                          placeholder="Tìm kiếm phường..."
                          value={wardSearch}
                          onChange={(e) => setWardSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <div className="create-promotion-options">
                        {filteredWards.length > 0 ? (
                          filteredWards.map((ward: Ward) => (
                            <div
                              key={ward._id}
                              className={`create-promotion-option ${
                                formData.wardId === ward._id ? 'selected' : ''
                              }`}
                              onClick={() => {
                                setFormData({ ...formData, wardId: ward._id })
                                setShowWardDropdown(false)
                                setWardSearch('')
                                if (errors.wardId) setErrors({ ...errors, wardId: '' })
                              }}
                            >
                              {ward.wardName}
                            </div>
                          ))
                        ) : (
                          <div className="create-promotion-option" style={{ cursor: 'default', color: '#9ca3af' }}>
                            Không tìm thấy phường nào
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {errors.wardId && <span className="create-promotion-error">{errors.wardId}</span>}
            </div>

            <div className="create-promotion-form-group">
              <label className="create-promotion-label">
                Địa chỉ đầy đủ <span className="create-promotion-required">*</span>
              </label>
              <input
                type="text"
                className={`create-promotion-input ${errors.fullAddress ? 'error' : ''}`}
                value={formData.fullAddress}
                onChange={(e) => {
                  setFormData({ ...formData, fullAddress: e.target.value })
                  if (errors.fullAddress) setErrors({ ...errors, fullAddress: '' })
                }}
                placeholder="VD: 29 Lê Duẩn, Phường Bến Nghé, Quận 1"
                disabled={isLoading}
              />
              {errors.fullAddress && (
                <span className="create-promotion-error">{errors.fullAddress}</span>
              )}
            </div>

            <div className="create-promotion-form-group">
              <label className="create-promotion-label">
                Vị trí trên bản đồ <span className="create-promotion-required">*</span>
              </label>
              <button
                type="button"
                className="create-promotion-button secondary"
                onClick={openLocationPicker}
                disabled={isLoading}
              >
                📍 Chọn vị trí trên bản đồ
              </button>
              {formLocation ? (
                <div className="promotion-form-info">
                  <span style={{ color: '#52c41a' }}>✓ Đã chọn vị trí</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                    ({formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)})
                  </span>
                </div>
              ) : (
                <div className="promotion-form-info">
                  <span style={{ color: '#ff4d4f' }}>✗ Chưa chọn vị trí</span>
                </div>
              )}
              {errors.latitude && (
                <span className="promotion-form-error">{errors.latitude}</span>
              )}
            </div>
          </div>

          {/* Parking Lot Section */}
          <div className="promotion-form-section">
            <h3 className="promotion-form-section-title">Thông tin bãi đỗ xe</h3>

            <div className="promotion-form-group">
              <label className="promotion-form-label">
                Tên bãi đỗ xe <span className="promotion-form-required">*</span>
              </label>
              <input
                type="text"
                className={`promotion-form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: '' })
                }}
                placeholder="VD: Bãi đỗ xe quận 1"
                disabled={isLoading}
              />
              {errors.name && <span className="promotion-form-error">{errors.name}</span>}
            </div>

            <div className="promotion-form-row">
              <div className="promotion-form-group">
                <label className="promotion-form-label">
                  Sức chứa mỗi tầng <span className="promotion-form-required">*</span>
                </label>
                <input
                  type="number"
                  className={`promotion-form-input ${errors.totalCapacityEachLevel ? 'error' : ''}`}
                  value={formData.totalCapacityEachLevel || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0
                    setFormData({ ...formData, totalCapacityEachLevel: value })
                    if (errors.totalCapacityEachLevel)
                      setErrors({ ...errors, totalCapacityEachLevel: '' })
                  }}
                  min="1"
                  placeholder="50"
                  disabled={isLoading}
                />
                {errors.totalCapacityEachLevel && (
                  <span className="promotion-form-error">{errors.totalCapacityEachLevel}</span>
                )}
              </div>

              <div className="promotion-form-group">
                <label className="promotion-form-label">
                  Tổng số tầng <span className="promotion-form-required">*</span>
                </label>
                <input
                  type="number"
                  className={`promotion-form-input ${errors.totalLevel ? 'error' : ''}`}
                  value={formData.totalLevel || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0
                    setFormData({ ...formData, totalLevel: value })
                    if (errors.totalLevel) setErrors({ ...errors, totalLevel: '' })
                  }}
                  min="1"
                  placeholder="5"
                  disabled={isLoading}
                />
                {errors.totalLevel && (
                  <span className="promotion-form-error">{errors.totalLevel}</span>
                )}
              </div>
            </div>

            <div className="promotion-form-group">
              <label className="promotion-form-label">
                Ngày hiệu lực <span className="promotion-form-required">*</span>
              </label>
              <input
                type="date"
                className={`promotion-form-input ${errors.effectiveDate ? 'error' : ''}`}
                value={formData.effectiveDate?.format('YYYY-MM-DD') || ''}
                onChange={(e) => {
                  const date = e.target.value ? dayjs(e.target.value) : null
                  setFormData({ ...formData, effectiveDate: date })
                  if (errors.effectiveDate) setErrors({ ...errors, effectiveDate: '' })
                }}
                min={dayjs().add(1, 'day').format('YYYY-MM-DD')}
                disabled={isLoading}
              />
              {errors.effectiveDate && (
                <span className="promotion-form-error">{errors.effectiveDate}</span>
              )}
            </div>

            <div className="promotion-form-row">
              <div className="promotion-form-group">
                <label className="promotion-form-label">
                  Sức chứa booking (chỗ)
                </label>
                <input
                  type="number"
                  className={`promotion-form-input ${errors.bookableCapacity ? 'error' : ''}`}
                  value={formData.bookableCapacity || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0
                    setFormData({ ...formData, bookableCapacity: value })
                    if (errors.bookableCapacity) setErrors({ ...errors, bookableCapacity: '' })
                  }}
                  min="0"
                  placeholder="20"
                  disabled={isLoading}
                />
                {errors.bookableCapacity && (
                  <span className="promotion-form-error">{errors.bookableCapacity}</span>
                )}
              </div>

              <div className="promotion-form-group">
                <label className="promotion-form-label">
                  Sức chứa thuê dài hạn (chỗ)
                </label>
                <input
                  type="number"
                  className={`promotion-form-input ${errors.leasedCapacity ? 'error' : ''}`}
                  value={formData.leasedCapacity || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0
                    setFormData({ ...formData, leasedCapacity: value })
                    if (errors.leasedCapacity) setErrors({ ...errors, leasedCapacity: '' })
                  }}
                  min="0"
                  placeholder="20"
                  disabled={isLoading}
                />
                {errors.leasedCapacity && (
                  <span className="promotion-form-error">{errors.leasedCapacity}</span>
                )}
              </div>
            </div>

            <div className="promotion-form-row">
              <div className="promotion-form-group">
                <label className="promotion-form-label">
                  Sức chứa khách vãng lai (chỗ)
                </label>
                <input
                  type="number"
                  className={`promotion-form-input ${errors.walkInCapacity ? 'error' : ''}`}
                  value={formData.walkInCapacity || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0
                    setFormData({ ...formData, walkInCapacity: value })
                    if (errors.walkInCapacity) setErrors({ ...errors, walkInCapacity: '' })
                  }}
                  min="0"
                  placeholder="50"
                  disabled={isLoading}
                />
                {errors.walkInCapacity && (
                  <span className="promotion-form-error">{errors.walkInCapacity}</span>
                )}
              </div>

              <div className="promotion-form-group">
                <label className="promotion-form-label">
                  Thời lượng slot đặt chỗ (giờ) <span className="promotion-form-required">*</span>
                </label>
                <input
                  type="number"
                  className={`promotion-form-input ${errors.bookingSlotDurationHours ? 'error' : ''}`}
                  value={formData.bookingSlotDurationHours || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0
                    setFormData({ ...formData, bookingSlotDurationHours: value })
                    if (errors.bookingSlotDurationHours)
                      setErrors({ ...errors, bookingSlotDurationHours: '' })
                  }}
                  min="1"
                  max="24"
                  placeholder="1"
                  disabled={isLoading}
                />
                {errors.bookingSlotDurationHours && (
                  <span className="promotion-form-error">{errors.bookingSlotDurationHours}</span>
                )}
              </div>
            </div>
          </div>

          <div className="promotion-form-actions">
            <button
              type="button"
              className="promotion-form-button cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="promotion-form-button submit"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Location Picker Modal */}
      {isLocationModalOpen && (
        <CustomModal
          open={isLocationModalOpen}
          onClose={handleLocationCancel}
          title="Chọn vị trí bãi đỗ"
          width={760}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ marginBottom: 12, color: '#666', fontSize: '14px' }}>
              Nhấp vào vị trí trên bản đồ để đặt điểm đánh dấu. Bạn có thể thu phóng hoặc kéo bản
              đồ để chọn chính xác vị trí bãi đỗ xe.
            </p>
            <LocationPickerMap
              value={mapLocation}
              onChange={handleLocationSelect}
              bounds={HO_CHI_MINH_BOUNDS_RECT}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="promotion-form-button cancel"
                onClick={handleLocationCancel}
              >
                Hủy
              </button>
              <button
                type="button"
                className="promotion-form-button submit"
                onClick={handleLocationConfirm}
              >
                Sử dụng vị trí này
              </button>
            </div>
          </div>
        </CustomModal>
      )}

      {/* Toast */}
      {toast && (
        <div className={`promotion-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.message}
        </div>
      )}
    </>
  )
}

export default CreateParkingLotRequestModal

