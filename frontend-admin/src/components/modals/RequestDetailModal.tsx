import { useParkingLotRequestDetailQuery } from '../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../types/ParkingLotRequest'
import CustomModal from '../common/CustomModal'
import {
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CarOutlined,
} from '@ant-design/icons'
import './RequestDetailModal.css'

type Option = { label: string; value: string }

interface RequestDetailModalProps {
  open: boolean
  request: ParkingLotRequest | null
  onClose: () => void
  statusOptions: Option[]
  typeOptions: Option[]
  statusTagColor: Record<string, string>
  typeTagColor: Record<string, string>
}

const getStatusLabel = (status: string, statusOptions: Option[]): string => {
  return statusOptions.find((s) => s.value === status)?.label || status
}

const getStatusClass = (status: string): string => {
  const statusClassMap: Record<string, string> = {
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    REJECTED: 'status-rejected',
    APPLIED: 'status-applied',
    FAILED: 'status-failed',
    CANCELLED: 'status-cancelled',
  }
  return statusClassMap[status] || 'status-default'
}

const getTypeLabel = (type: string, typeOptions: Option[]): string => {
  return typeOptions.find((t) => t.value === type)?.label || type
}

const getTypeClass = (type: string): string => {
  const typeClassMap: Record<string, string> = {
    CREATE: 'type-create',
    UPDATE: 'type-update',
    DELETE: 'type-delete',
  }
  return typeClassMap[type] || 'type-default'
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  open,
  request,
  onClose,
  statusOptions,
  typeOptions,
}) => {
  const shouldFetchRequestDetail = Boolean(
    open && request?._id && request?.requestType === 'UPDATE'
  )

  const {
    data: requestDetail,
    isLoading: isRequestDetailLoading,
    error: requestDetailError,
  } = useParkingLotRequestDetailQuery(
    { id: request?._id || '' },
    { skip: !shouldFetchRequestDetail }
  )

  const detailRecordRaw = requestDetail?.data ?? requestDetail
  const detailRecord = Array.isArray(detailRecordRaw) ? detailRecordRaw[0] : detailRecordRaw

  const resolvedRequest = (
    shouldFetchRequestDetail && detailRecord ? (detailRecord as ParkingLotRequest) : request
  ) as ParkingLotRequest | null

  if (!request) {
    return null
  }

  const statusClass = getStatusClass(resolvedRequest?.status || request.status)
  const statusLabel = getStatusLabel(resolvedRequest?.status || request.status, statusOptions)
  const typeClass = getTypeClass(resolvedRequest?.requestType || request.requestType)
  const typeLabel = getTypeLabel(resolvedRequest?.requestType || request.requestType, typeOptions)

  const footer = (
    <button className="request-detail-close-btn" onClick={onClose}>
      Đóng
    </button>
  )

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Chi tiết yêu cầu bãi đỗ xe"
      footer={footer}
      width="900px"
      loading={isRequestDetailLoading}
    >
      {isRequestDetailLoading ? (
        <div className="request-detail-loading">
          <div className="request-detail-loading-spinner" />
          <p>Đang tải chi tiết yêu cầu...</p>
        </div>
      ) : requestDetailError ? (
        <div className="request-detail-error">
          <span className="request-detail-error-badge">Lỗi</span>
          <p>{(requestDetailError as any)?.data?.message || 'Không thể tải chi tiết yêu cầu'}</p>
        </div>
      ) : resolvedRequest ? (
        <div className="request-detail-content">
          {/* Header Info */}
          <div className="request-detail-header">
            <div className="request-detail-header-main">
              <h3 className="request-detail-title">{resolvedRequest.payload?.name || 'N/A'}</h3>
              <div className="request-detail-badges">
                <div className={`request-detail-type-badge ${typeClass}`}>
                  <span>{typeLabel}</span>
                </div>
                <div className={`request-detail-status-badge ${statusClass}`}>
                  <span className="request-detail-status-dot" />
                  <span>{statusLabel}</span>
                </div>
              </div>
            </div>
            <div className="request-detail-header-meta">
              <div className="request-detail-meta-item">
                <CalendarOutlined />
                <div>
                  <span className="request-detail-meta-label">Ngày tạo</span>
                  <span className="request-detail-meta-value">
                    {resolvedRequest.createdAt ? formatDateTime(resolvedRequest.createdAt) : '--'}
                  </span>
                </div>
              </div>
              <div className="request-detail-meta-item">
                <ClockCircleOutlined />
                <div>
                  <span className="request-detail-meta-label">Ngày hiệu lực</span>
                  <span className="request-detail-meta-value">
                    {resolvedRequest.effectiveDate
                      ? new Date(resolvedRequest.effectiveDate).toLocaleDateString('vi-VN')
                      : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Request Info Section */}
          <div className="request-detail-section">
            <div className="request-detail-section-header">
              <FileTextOutlined />
              <h4 className="request-detail-section-title">Thông tin yêu cầu</h4>
            </div>
            <div className="request-detail-info-grid">
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Tên bãi đỗ xe</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.name || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Địa chỉ</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.addressId?.fullAddress || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Tổng số tầng</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.totalLevel ?? 'Chưa cập nhật'}
                </span>
              </div>
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Sức chứa mỗi tầng</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.totalCapacityEachLevel ?? 'Chưa cập nhật'}
                </span>
              </div>
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Sức chứa đặt chỗ</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.bookableCapacity ?? 'Chưa cập nhật'}
                </span>
              </div>
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Sức chứa gói tháng</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.leasedCapacity ?? 'Chưa cập nhật'}
                </span>
              </div>
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Sức chứa gửi lượt</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.walkInCapacity ?? 'Chưa cập nhật'}
                </span>
              </div>
              <div className="request-detail-info-item">
                <span className="request-detail-info-label">Thời lượng slot đặt chỗ (giờ)</span>
                <span className="request-detail-info-value">
                  {resolvedRequest.payload?.bookingSlotDurationHours ?? 'Chưa cập nhật'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Parking Lot Info (if exists) */}
          {resolvedRequest.parkingLotId && (
            <div className="request-detail-section">
              <div className="request-detail-section-header">
                <CarOutlined />
                <h4 className="request-detail-section-title">Thông tin bãi đỗ xe hiện tại</h4>
              </div>
              <div className="request-detail-info-grid">
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Tên bãi đỗ xe</span>
                  <span className="request-detail-info-value">
                    {resolvedRequest.parkingLotId.name || 'Không xác định'}
                  </span>
                </div>
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Trạng thái</span>
                  <span className="request-detail-info-value">
                    <div
                      className={`request-detail-status-badge ${getStatusClass(
                        resolvedRequest.parkingLotId.parkingLotStatus || ''
                      )}`}
                    >
                      <span className="request-detail-status-dot" />
                      <span>
                        {resolvedRequest.parkingLotId.parkingLotStatus || 'Không xác định'}
                      </span>
                    </div>
                  </span>
                </div>
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Tổng số tầng</span>
                  <span className="request-detail-info-value">
                    {resolvedRequest.parkingLotId.totalLevel ?? 'Không xác định'}
                  </span>
                </div>
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Sức chứa mỗi tầng</span>
                  <span className="request-detail-info-value">
                    {resolvedRequest.parkingLotId.totalCapacityEachLevel ?? 'Không xác định'}
                  </span>
                </div>
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Sức chứa đặt chỗ</span>
                  <span className="request-detail-info-value">
                    {resolvedRequest.parkingLotId.bookableCapacity ?? 'Không xác định'}
                  </span>
                </div>
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Sức chứa gói tháng</span>
                  <span className="request-detail-info-value">
                    {resolvedRequest.parkingLotId.leasedCapacity ?? 'Không xác định'}
                  </span>
                </div>
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Sức chứa gửi lượt</span>
                  <span className="request-detail-info-value">
                    {resolvedRequest.parkingLotId.walkInCapacity ?? 'Không xác định'}
                  </span>
                </div>
                <div className="request-detail-info-item">
                  <span className="request-detail-info-label">Số chỗ khả dụng</span>
                  <span className="request-detail-info-value">
                    {resolvedRequest.parkingLotId.availableSpots ?? 'Không xác định'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </CustomModal>
  )
}

export default RequestDetailModal
