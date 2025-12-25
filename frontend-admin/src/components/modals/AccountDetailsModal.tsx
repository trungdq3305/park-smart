import React, { useMemo, useState, useEffect } from 'react'
import { message } from 'antd'
import type { Account } from '../../types/Account'
import { useAccountDetailsQuery, useConfirmOperatorMutation } from '../../features/admin/accountAPI'
import {
  useParkingLotDetailsQuery,
  useReviewParkingLotRequestMutation,
} from '../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../types/ParkingLotRequest'
import type { Address } from '../../types/Address'
import { useGetAddressByIdQuery } from '../../features/operator/addressAPI'
import { CustomModal } from '../common'
import './AccountDetailsModal.css'

interface AccountDetailsModalProps {
  open: boolean
  onClose: () => void
  account: Account | null
}
interface ParkingLotRequestReponse {
  data: {
    data: ParkingLotRequest[]
  }
}
interface AddressResponse {
  data: {
    data: Address[]
  }
  isLoading: boolean
}
const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ open, onClose, account }) => {
  const [confirmOperator, { isLoading: isConfirmingOperator }] = useConfirmOperatorMutation()
  const [rejectionReason, setRejectionReason] = useState('')
  const [localIsActive, setLocalIsActive] = useState(account?.isActive ?? false)
  const { data: accountDetails } = useAccountDetailsQuery(account?._id || '')
  const operatorId = accountDetails?.data?.operatorDetail?._id || ''

  // Sync localIsActive when modal opens or account changes
  // Only sync if account._id changes (different account) or modal just opened
  useEffect(() => {
    if (open && account?.isActive !== undefined) {
      setLocalIsActive(account.isActive)
    }
  }, [open, account?._id]) // Removed account?.isActive to avoid overwriting after mutation

  const { data: parkingLotDetails } = useParkingLotDetailsQuery<ParkingLotRequestReponse>({
    parkingLotOperatorId: operatorId,
    status: 'PENDING',
    type: 'CREATE',
  })

  const parkingLotDetailsData = parkingLotDetails?.data?.[0]
  const addressId = parkingLotDetailsData?.payload?.addressId
  const requestId = parkingLotDetailsData?._id

  const { data: addressDetails } = useGetAddressByIdQuery<AddressResponse>({ id: addressId })

  const [reviewParkingLotRequest, { isLoading: isReviewingParkingLotRequest }] =
    useReviewParkingLotRequestMutation()

  const addressDetailsData = addressDetails?.data?.[0] || null

  const roleBadgeClass = useMemo(() => {
    switch (account?.roleName?.toLowerCase()) {
      case 'admin':
        return 'account-badge purple'
      case 'operator':
        return 'account-badge blue'
      case 'driver':
        return 'account-badge orange'
      default:
        return 'account-badge gray'
    }
  }, [account?.roleName])

  const statusBadgeClass = localIsActive ? 'account-status active' : 'account-status inactive'

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Chưa đăng nhập'
    return new Date(value).toLocaleString('vi-VN')
  }

  const formatDate = (value?: string | null) => {
    if (!value) return 'Chưa xác định'
    return new Date(value).toLocaleDateString('vi-VN')
  }

  const extractBackendMessage = (error: unknown) =>
    (error as { data?: { message?: string; error?: string } })?.data?.message ||
    (error as { data?: { message?: string; error?: string } })?.data?.error

  const handleConfirmOperator = async () => {
    if (!account?._id) return
    try {
      await confirmOperator(account._id).unwrap()
      setLocalIsActive(true) // Update local state immediately
      message.success('Xác nhận tài khoản operator thành công')
    } catch (error) {
      const backendMessage = extractBackendMessage(error)
      message.error(backendMessage || 'Xác nhận tài khoản operator thất bại')
    }
  }

  const handleApproveParkingLotRequest = async () => {
    if (!requestId) return
    try {
      await reviewParkingLotRequest({ requestId, status: 'APPROVED' }).unwrap()
      message.success('Duyệt bãi đỗ xe thành công')
      onClose()
    } catch (error) {
      const backendMessage = extractBackendMessage(error)
      message.error(backendMessage || 'Duyệt bãi đỗ xe thất bại')
    }
  }

  const handleRejectParkingLotRequest = async () => {
    if (!requestId) return
    if (!rejectionReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối')
      return
    }
    try {
      await reviewParkingLotRequest({
        requestId,
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
      }).unwrap()
      message.success('Đã từ chối bãi đỗ xe')
      setRejectionReason('')
      onClose()
    } catch (error) {
      const backendMessage = extractBackendMessage(error)
      message.error(backendMessage || 'Từ chối bãi đỗ xe thất bại')
    }
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Chi tiết tài khoản"
      width={900}
      footer={
        <div className="account-details-footer">
          <button className="account-btn account-btn-ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      }
    >
      {account && (
        <div className="account-details-container">
          <div className="account-section card">
            <div className="account-header">
              <div>
                <div className="account-title">{account.email}</div>
                <div className="account-subtitle">{account.phoneNumber || 'Chưa cập nhật SĐT'}</div>
              </div>
              <div className="account-badges">
                <span className={roleBadgeClass}>{account.roleName}</span>
                <span className={statusBadgeClass}>
                  <span className="status-dot" />
                  {localIsActive ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>

            <div className="account-grid">
              <div className="account-field">
                <div className="label">Lần đăng nhập cuối</div>
                <div className="value">{formatDateTime(account.lastLoginAt)}</div>
              </div>
              <div className="account-field">
                <div className="label">Tài khoản ID</div>
                <div className="value value-mono">{account._id?.slice(-12)}</div>
              </div>
            </div>
          </div>

          {/* Role-specific details */}
          {account.driverDetail && (
            <div className="account-section card">
              <div className="section-title">Thông tin Driver</div>
              <div className="account-grid">
                <div className="account-field">
                  <div className="label">Tên đầy đủ</div>
                  <div className="value">{account.driverDetail.fullName}</div>
                </div>
                <div className="account-field">
                  <div className="label">Giới tính</div>
                  <div className="value">{account.driverDetail.gender ? 'Nam' : 'Nữ'}</div>
                </div>
                <div className="account-field">
                  <div className="label">Điểm tín dụng</div>
                  <div className="value value-strong">{account.driverDetail.creditPoint}</div>
                </div>
                <div className="account-field">
                  <div className="label">Điểm tích lũy</div>
                  <div className="value value-strong">{account.driverDetail.accumulatedPoints}</div>
                </div>
              </div>
            </div>
          )}

          {account.operatorDetail && (
            <div className="account-section card">
              <div className="section-title">Thông tin Operator</div>
              <div className="account-grid">
                <div className="account-field">
                  <div className="label">Tên đầy đủ</div>
                  <div className="value">{account.operatorDetail.fullName}</div>
                </div>
                <div className="account-field">
                  <div className="label">Tên doanh nghiệp</div>
                  <div className="value">{account.operatorDetail.bussinessName}</div>
                </div>
                <div className="account-field">
                  <div className="label">Mã số thuế</div>
                  <div className="value">
                    {account.operatorDetail.taxCode ? account.operatorDetail.taxCode : 'Không có'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Email thanh toán</div>
                  <div className="value">
                    {account.operatorDetail.paymentEmail
                      ? account.operatorDetail.paymentEmail
                      : 'Không có'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Duyệt tài khoản</div>
                  <button
                    className="account-btn account-btn-primary"
                    onClick={handleConfirmOperator}
                    disabled={isConfirmingOperator || localIsActive}
                  >
                    {isConfirmingOperator ? 'Đang duyệt...' : 'Duyệt'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {account.operatorDetail && parkingLotDetailsData && (
            <div className="account-section card">
              <div className="section-title">Bãi xe đăng ký</div>
              <div className="account-grid">
                <div className="account-field">
                  <div className="label">Tên bãi xe</div>
                  <div className="value">
                    {parkingLotDetailsData.payload?.name || 'Chưa cung cấp'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Loại yêu cầu</div>
                  <div className="value">{parkingLotDetailsData.requestType}</div>
                </div>
                <div className="account-field">
                  <div className="label">Trạng thái yêu cầu</div>
                  <span className="account-badge blue">{parkingLotDetailsData.status}</span>
                </div>
                <div className="account-field full">
                  <div className="label">Địa chỉ</div>
                  <div className="value">{addressDetailsData?.fullAddress || 'Chưa cung cấp'}</div>
                </div>
                <div className="account-field">
                  <div className="label">Tổng tầng</div>
                  <div className="value value-strong">
                    {parkingLotDetailsData.payload?.totalLevel ?? 'Chưa cung cấp'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Sức chứa mỗi tầng</div>
                  <div className="value value-strong">
                    {parkingLotDetailsData.payload?.totalCapacityEachLevel ?? 'Chưa cung cấp'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Sức chứa đặt trước</div>
                  <div className="value value-strong">
                    {parkingLotDetailsData.payload?.bookableCapacity ?? 'Chưa cung cấp'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Sức chứa thuê dài hạn</div>
                  <div className="value value-strong">
                    {parkingLotDetailsData.payload?.leasedCapacity ?? 'Chưa cung cấp'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Sức chứa vãng lai</div>
                  <div className="value value-strong">
                    {parkingLotDetailsData.payload?.walkInCapacity ?? 'Chưa cung cấp'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Thời lượng slot (giờ)</div>
                  <div className="value value-strong">
                    {parkingLotDetailsData.payload?.bookingSlotDurationHours ?? 'Chưa cung cấp'}
                  </div>
                </div>
                <div className="account-field">
                  <div className="label">Ngày hiệu lực</div>
                  <div className="value">{formatDate(parkingLotDetailsData.effectiveDate)}</div>
                </div>
              </div>

              <div className="account-action-card">
                <div className="label">Lý do từ chối</div>
                <textarea
                  className="account-textarea"
                  rows={3}
                  placeholder="Nhập lý do từ chối (nếu có)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={isReviewingParkingLotRequest}
                />
                <div className="account-action-buttons">
                  <button
                    className="account-btn account-btn-primary"
                    onClick={handleApproveParkingLotRequest}
                    disabled={isReviewingParkingLotRequest}
                  >
                    {isReviewingParkingLotRequest ? 'Đang duyệt...' : 'Duyệt'}
                  </button>
                  <button
                    className="account-btn account-btn-danger"
                    onClick={handleRejectParkingLotRequest}
                    disabled={isReviewingParkingLotRequest}
                  >
                    {isReviewingParkingLotRequest ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {account.adminDetail && (
            <div className="account-section card">
              <div className="section-title">Thông tin Admin</div>
              <div className="account-grid">
                <div className="account-field">
                  <div className="label">Tên đầy đủ</div>
                  <div className="value">{account.adminDetail.fullName}</div>
                </div>
                <div className="account-field">
                  <div className="label">Phòng ban</div>
                  <div className="value">{account.adminDetail.department}</div>
                </div>
                <div className="account-field">
                  <div className="label">Chức vụ</div>
                  <div className="value">{account.adminDetail.position}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </CustomModal>
  )
}

export default AccountDetailsModal
