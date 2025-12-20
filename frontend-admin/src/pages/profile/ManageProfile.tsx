import React, { useEffect, useState, useMemo } from 'react'
import { message } from 'antd'
import { getUserData } from '../../utils/userData'
import { useNavigateHome } from '../../hooks/useNavigateHome'
import {
  useUpdateAdminProfileMutation,
  useUpdateOperatorProfileMutation,
} from '../../features/profile/profileAPI'
import './ManageProfile.css'

interface AdminFormData {
  phoneNumber: string
  fullName: string
  department: string
  position: string
}

interface OperatorFormData {
  phoneNumber: string
  fullName: string
  fullAddress: string
}

interface FormErrors {
  phoneNumber?: string
  fullName?: string
  department?: string
  position?: string
  fullAddress?: string
}

const ManageProfile: React.FC = () => {
  const userData = useMemo(
    () =>
      getUserData<{
        role?: string
        fullName?: string
        phoneNumber?: string
        department?: string
        position?: string
        fullAddress?: string
        email?: string
      }>(),
    []
  ) // getUserData() đã có cache, chỉ gọi 1 lần
  console.log(userData)
  const isAdmin = useMemo(() => userData?.role === 'Admin', [userData?.role])
  const { navigateToHome } = useNavigateHome()
  const [updateAdminProfile, { isLoading: isUpdatingAdmin }] = useUpdateAdminProfileMutation()
  const [updateOperatorProfile, { isLoading: isUpdatingOperator }] =
    useUpdateOperatorProfileMutation()

  const [adminFormData, setAdminFormData] = useState<AdminFormData>({
    phoneNumber: '',
    fullName: '',
    department: '',
    position: '',
  })

  const [operatorFormData, setOperatorFormData] = useState<OperatorFormData>({
    phoneNumber: '',
    fullName: '',
    fullAddress: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const isLoading = isUpdatingAdmin || isUpdatingOperator

  // Initialize form data only once on mount
  useEffect(() => {
    if (userData) {
      if (isAdmin) {
        setAdminFormData({
          phoneNumber: userData.phoneNumber || '',
          fullName: userData.fullName || '',
          department: userData.department || '',
          position: userData.position || '',
        })
      } else {
        setOperatorFormData({
          phoneNumber: userData.phoneNumber || '',
          fullName: userData.fullName || '',
          fullAddress: userData.fullAddress || '',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const validateAdminForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!adminFormData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(adminFormData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ'
    }

    if (!adminFormData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên'
    }

    if (!adminFormData.department.trim()) {
      newErrors.department = 'Vui lòng nhập phòng ban'
    }

    if (!adminFormData.position.trim()) {
      newErrors.position = 'Vui lòng nhập chức vụ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOperatorForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!operatorFormData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(operatorFormData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ'
    }

    if (!operatorFormData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên'
    }

    if (!operatorFormData.fullAddress.trim()) {
      newErrors.fullAddress = 'Vui lòng nhập địa chỉ đầy đủ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdminSubmit = async () => {
    if (!validateAdminForm()) {
      return
    }

    try {
      await updateAdminProfile({
        phoneNumber: adminFormData.phoneNumber.trim(),
        fullName: adminFormData.fullName.trim(),
        department: adminFormData.department.trim(),
        position: adminFormData.position.trim(),
      }).unwrap()
      message.success('Cập nhật thông tin thành công')
    } catch (error: any) {
      message.error(error?.data?.message || 'Cập nhật thông tin thất bại')
    }
  }

  const handleOperatorSubmit = async () => {
    if (!validateOperatorForm()) {
      return
    }

    try {
      await updateOperatorProfile({
        phoneNumber: operatorFormData.phoneNumber.trim(),
        fullName: operatorFormData.fullName.trim(),
        fullAddress: operatorFormData.fullAddress.trim(),
      }).unwrap()
      message.success('Cập nhật thông tin thành công')
    } catch (error: any) {
      message.error(error?.data?.message || 'Cập nhật thông tin thất bại')
    }
  }

  if (!userData) {
    return (
      <div className="manage-profile-page">
        <div className="profile-error">
          <span className="profile-error-badge">Lỗi</span>
          <p>Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-profile-page">
      <div className="profile-page-header">
        <div>
          <h1>Chỉnh sửa thông tin cá nhân</h1>
          <p>Cập nhật thông tin tài khoản của bạn trong hệ thống Park Smart</p>
        </div>
        <button type="button" className="profile-back-btn" onClick={navigateToHome}>
          Trở về trang chủ
        </button>
      </div>

      <div className="profile-page-content">
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar">
              <span className="profile-avatar-icon">👤</span>
            </div>
            <div className="profile-header-info">
              <h2>{userData.fullName || 'Người dùng'}</h2>
              <div className="profile-role-badge">{isAdmin ? '🛠️ Admin' : '🏢 Operator'}</div>
              {userData.email && <div className="profile-email">{userData.email}</div>}
            </div>
          </div>

          <div className="profile-form">
            {isAdmin ? (
              <>
                <div className="profile-form-group">
                  <label className="profile-form-label">
                    Số điện thoại <span className="profile-form-required">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`profile-form-input ${errors.phoneNumber ? 'error' : ''}`}
                    placeholder="Nhập số điện thoại"
                    value={adminFormData.phoneNumber}
                    onChange={(e) => {
                      setAdminFormData({ ...adminFormData, phoneNumber: e.target.value })
                      if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined })
                    }}
                  />
                  {errors.phoneNumber && (
                    <span className="profile-form-error">{errors.phoneNumber}</span>
                  )}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    Họ và tên <span className="profile-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`profile-form-input ${errors.fullName ? 'error' : ''}`}
                    placeholder="Nhập họ và tên"
                    value={adminFormData.fullName}
                    onChange={(e) => {
                      setAdminFormData({ ...adminFormData, fullName: e.target.value })
                      if (errors.fullName) setErrors({ ...errors, fullName: undefined })
                    }}
                  />
                  {errors.fullName && <span className="profile-form-error">{errors.fullName}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    Phòng ban <span className="profile-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`profile-form-input ${errors.department ? 'error' : ''}`}
                    placeholder="Nhập phòng ban"
                    value={adminFormData.department}
                    onChange={(e) => {
                      setAdminFormData({ ...adminFormData, department: e.target.value })
                      if (errors.department) setErrors({ ...errors, department: undefined })
                    }}
                  />
                  {errors.department && (
                    <span className="profile-form-error">{errors.department}</span>
                  )}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    Chức vụ <span className="profile-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`profile-form-input ${errors.position ? 'error' : ''}`}
                    placeholder="Nhập chức vụ"
                    value={adminFormData.position}
                    onChange={(e) => {
                      setAdminFormData({ ...adminFormData, position: e.target.value })
                      if (errors.position) setErrors({ ...errors, position: undefined })
                    }}
                  />
                  {errors.position && <span className="profile-form-error">{errors.position}</span>}
                </div>
              </>
            ) : (
              <>
                <div className="profile-form-group">
                  <label className="profile-form-label">
                    Số điện thoại <span className="profile-form-required">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`profile-form-input ${errors.phoneNumber ? 'error' : ''}`}
                    placeholder="Nhập số điện thoại"
                    value={operatorFormData.phoneNumber}
                    onChange={(e) => {
                      setOperatorFormData({ ...operatorFormData, phoneNumber: e.target.value })
                      if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined })
                    }}
                  />
                  {errors.phoneNumber && (
                    <span className="profile-form-error">{errors.phoneNumber}</span>
                  )}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    Họ và tên <span className="profile-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    className={`profile-form-input ${errors.fullName ? 'error' : ''}`}
                    placeholder="Nhập họ và tên"
                    value={operatorFormData.fullName}
                    onChange={(e) => {
                      setOperatorFormData({ ...operatorFormData, fullName: e.target.value })
                      if (errors.fullName) setErrors({ ...errors, fullName: undefined })
                    }}
                  />
                  {errors.fullName && <span className="profile-form-error">{errors.fullName}</span>}
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">
                    Địa chỉ đầy đủ <span className="profile-form-required">*</span>
                  </label>
                  <textarea
                    className={`profile-form-textarea ${errors.fullAddress ? 'error' : ''}`}
                    rows={4}
                    placeholder="Nhập địa chỉ đầy đủ"
                    value={operatorFormData.fullAddress}
                    onChange={(e) => {
                      setOperatorFormData({ ...operatorFormData, fullAddress: e.target.value })
                      if (errors.fullAddress) setErrors({ ...errors, fullAddress: undefined })
                    }}
                  />
                  {errors.fullAddress && (
                    <span className="profile-form-error">{errors.fullAddress}</span>
                  )}
                </div>
              </>
            )}

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-submit-btn"
                onClick={isAdmin ? handleAdminSubmit : handleOperatorSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageProfile
