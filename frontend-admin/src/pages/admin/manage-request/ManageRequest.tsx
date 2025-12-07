import { useMemo, useState } from 'react'
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import {
  useParkingLotRequestsQuery,
  useReviewParkingLotRequestMutation,
} from '../../../features/admin/parkinglotAPI'
import type { ParkingLotRequest } from '../../../types/ParkingLotRequest'
import { RequestDetailModal } from '../../../components/modals'
import { Modal, Input, message } from 'antd'
import { useSearchParams } from 'react-router-dom'
import './ManageRequest.css'

const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  APPLIED: 'APPLIED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

const RequestType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const

type RequestStatusValue = (typeof RequestStatus)[keyof typeof RequestStatus]
type RequestTypeValue = (typeof RequestType)[keyof typeof RequestType]

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'Đang chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
    APPLIED: 'Đã áp dụng',
    FAILED: 'Thất bại',
    CANCELLED: 'Đã hủy',
  }
  return statusMap[status] || status
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

const getTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
  }
  return typeMap[type] || type
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

const ManageRequest: React.FC = () => {
  const [status, setStatus] = useState<RequestStatusValue>(
    (window.location.search &&
      (new URLSearchParams(window.location.search).get('status') as RequestStatusValue)) ||
      RequestStatus.PENDING
  )
  const [type, setType] = useState<RequestTypeValue>(
    (window.location.search &&
      (new URLSearchParams(window.location.search).get('type') as RequestTypeValue)) ||
      RequestType.UPDATE
  )
  const [selectedRequest, setSelectedRequest] = useState<ParkingLotRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [requestBeingReviewed, setRequestBeingReviewed] = useState<ParkingLotRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 10

  const { data, isLoading, error } = useParkingLotRequestsQuery({
    status,
    type,
    page: currentPage,
    pageSize,
  })

  const [reviewParkingLotRequest, { isLoading: isReviewLoading }] =
    useReviewParkingLotRequestMutation()

  const apiError = error as any
  const isNotFoundError =
    apiError?.status === 404 ||
    apiError?.data?.statusCode === 404 ||
    apiError?.statusCode === 404

  const parkingLotRequests: ParkingLotRequest[] = isNotFoundError
    ? []
    : (data as { data?: ParkingLotRequest[] })?.data || []

  const pagination = (data as { pagination?: { total: number; page: number; pageSize: number } })
    ?.pagination

  const updateSearchParams = (updates: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value.toString())
      }
    })

    setSearchParams(newSearchParams, { replace: true })
  }

  const handleStatusChange = (value: RequestStatusValue) => {
    setStatus(value)
    updateSearchParams({ status: value, page: 1 })
  }

  const handleTypeChange = (value: RequestTypeValue) => {
    setType(value)
    updateSearchParams({ type: value, page: 1 })
  }

  const handlePageChange = (page: number) => {
    updateSearchParams({ page })
  }

  const stats = useMemo(() => {
    const total = pagination?.total || parkingLotRequests.length
    const pending = parkingLotRequests.filter((r) => r.status === RequestStatus.PENDING).length
    const approved = parkingLotRequests.filter((r) => r.status === RequestStatus.APPROVED).length
    const rejected = parkingLotRequests.filter((r) => r.status === RequestStatus.REJECTED).length
    const applied = parkingLotRequests.filter((r) => r.status === RequestStatus.APPLIED).length
    const failed = parkingLotRequests.filter((r) => r.status === RequestStatus.FAILED).length
    const cancelled = parkingLotRequests.filter((r) => r.status === RequestStatus.CANCELLED).length

    return { total, pending, approved, rejected, applied, failed, cancelled }
  }, [parkingLotRequests, pagination])

  const handleApproveRequest = async (record: ParkingLotRequest) => {
    try {
      await reviewParkingLotRequest({
        requestId: record._id,
        status: RequestStatus.APPROVED,
        rejectionReason: undefined,
      }).unwrap()

      message.success(
        `Yêu cầu bãi đỗ xe "${record.payload.name}" đã được chấp thuận thành công.`
      )
    } catch (err: any) {
      message.error(err?.data?.message || 'Chấp thuận yêu cầu thất bại')
    }
  }

  const openRejectModal = (record: ParkingLotRequest) => {
    setRequestBeingReviewed(record)
    setRejectReason('')
    setIsRejectModalOpen(true)
  }

  const handleCancelRejectModal = () => {
    setIsRejectModalOpen(false)
    setRejectReason('')
    setRequestBeingReviewed(null)
  }

  const handleConfirmReject = async () => {
    if (!requestBeingReviewed) return

    try {
      await reviewParkingLotRequest({
        requestId: requestBeingReviewed._id,
        status: RequestStatus.REJECTED,
        rejectionReason: rejectReason.trim(),
      }).unwrap()

      message.success(`Yêu cầu bãi đỗ xe "${requestBeingReviewed.payload.name}" đã bị từ chối.`)
      handleCancelRejectModal()
    } catch (err: any) {
      message.error(err?.data?.message || 'Từ chối yêu cầu thất bại')
    }
  }

  if (isLoading) {
    return (
      <div className="manage-request-page">
        <div className="request-loading">
          <div className="request-loading-spinner" />
          <p>Đang tải danh sách yêu cầu...</p>
        </div>
      </div>
    )
  }

  if (error && !isNotFoundError) {
    return (
      <div className="manage-request-page">
        <div className="request-error">
          <span className="request-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-request-page">
      <div className="request-page-header">
        <div>
          <h1>Quản lý yêu cầu bãi đỗ xe</h1>
          <p>Theo dõi và phê duyệt các yêu cầu tạo mới / cập nhật / xóa bãi đỗ xe từ Operator</p>
        </div>
      </div>

      <div className="request-page-content">
        {/* Stats Section */}
        <div className="request-stats-section">
          <div className="request-stat-card">
            <div className="request-stat-icon total">
              <FileTextOutlined />
            </div>
            <div className="request-stat-content">
              <h3>{stats.total}</h3>
              <p>Tổng yêu cầu</p>
              <div className="request-stat-sub">Tất cả yêu cầu</div>
            </div>
          </div>
          <div className="request-stat-card">
            <div className="request-stat-icon pending">
              <ClockCircleOutlined />
            </div>
            <div className="request-stat-content">
              <h3>{stats.pending}</h3>
              <p>Đang chờ</p>
              <div className="request-stat-sub">Chờ duyệt</div>
            </div>
          </div>
          <div className="request-stat-card">
            <div className="request-stat-icon approved">
              <CheckCircleOutlined />
            </div>
            <div className="request-stat-content">
              <h3>{stats.approved}</h3>
              <p>Đã duyệt</p>
              <div className="request-stat-sub">Đã được duyệt</div>
            </div>
          </div>
          <div className="request-stat-card">
            <div className="request-stat-icon rejected">
              <CloseCircleOutlined />
            </div>
            <div className="request-stat-content">
              <h3>{stats.rejected}</h3>
              <p>Đã từ chối</p>
              <div className="request-stat-sub">Bị từ chối</div>
            </div>
          </div>
          <div className="request-stat-card">
            <div className="request-stat-icon applied">
              <CheckCircleOutlined />
            </div>
            <div className="request-stat-content">
              <h3>{stats.applied}</h3>
              <p>Đã áp dụng</p>
              <div className="request-stat-sub">Đã áp dụng</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="request-controls-card">
          <div className="request-filter-wrapper">
            <div className="request-filter-item">
              <label htmlFor="status-filter" className="request-filter-label">
                Trạng thái:
              </label>
              <select
                id="status-filter"
                className="request-filter-select"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as RequestStatusValue)}
              >
                <option value={RequestStatus.PENDING}>Đang chờ duyệt</option>
                <option value={RequestStatus.APPROVED}>Đã duyệt</option>
                <option value={RequestStatus.REJECTED}>Đã từ chối</option>
                <option value={RequestStatus.APPLIED}>Đã áp dụng</option>
                <option value={RequestStatus.FAILED}>Thất bại</option>
                <option value={RequestStatus.CANCELLED}>Đã hủy</option>
              </select>
            </div>
            <div className="request-filter-item">
              <label htmlFor="type-filter" className="request-filter-label">
                Loại yêu cầu:
              </label>
              <select
                id="type-filter"
                className="request-filter-select"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as RequestTypeValue)}
              >
                <option value={RequestType.CREATE}>Yêu cầu tạo mới</option>
                <option value={RequestType.UPDATE}>Yêu cầu cập nhật</option>
                <option value={RequestType.DELETE}>Yêu cầu xóa</option>
              </select>
            </div>
          </div>
          <div className="request-counter">
            Đang hiển thị <strong>{parkingLotRequests.length}</strong> / {stats.total} yêu cầu
          </div>
        </div>

        {/* Request List */}
        {parkingLotRequests.length === 0 ? (
          <div className="request-empty-state">
            <div className="request-empty-icon">📋</div>
            <h3 className="request-empty-title">Chưa có yêu cầu nào</h3>
            <p className="request-empty-text">
              {isNotFoundError
                ? apiError?.data?.message || 'Không tìm thấy yêu cầu nào với bộ lọc hiện tại.'
                : 'Không có yêu cầu nào phù hợp với bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <>
            <div className="request-list">
              {parkingLotRequests.map((request) => {
                const statusClass = getStatusClass(request.status)
                const statusLabel = getStatusLabel(request.status)
                const typeClass = getTypeClass(request.requestType)
                const typeLabel = getTypeLabel(request.requestType)
                const canApprove = request.status === RequestStatus.PENDING

                return (
                  <div key={request._id} className="request-item">
                    <div className="request-item-header">
                      <div className="request-item-title-section">
                        <h3 className="request-item-title">{request.payload.name || 'N/A'}</h3>
                        <div className={`request-type-badge ${typeClass}`}>
                          <span>{typeLabel}</span>
                        </div>
                        <div className={`request-status-badge ${statusClass}`}>
                          <span className="request-status-dot" />
                          <span>{statusLabel}</span>
                        </div>
                      </div>
                      <div className="request-item-actions">
                        <button
                          className="request-view-btn"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsDetailModalOpen(true)
                          }}
                          title="Xem chi tiết"
                        >
                          <EyeOutlined />
                          <span>Xem chi tiết</span>
                        </button>
                        {canApprove && (
                          <>
                            <button
                              className="request-approve-btn"
                              onClick={() => handleApproveRequest(request)}
                              disabled={isReviewLoading}
                              title="Chấp thuận yêu cầu"
                            >
                              <CheckOutlined />
                              <span>Chấp thuận</span>
                            </button>
                            <button
                              className="request-reject-btn"
                              onClick={() => openRejectModal(request)}
                              title="Từ chối yêu cầu"
                            >
                              <CloseOutlined />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="request-item-body">
                      <div className="request-info-item">
                        <EnvironmentOutlined />
                        <span>{request.payload.addressId?.fullAddress || 'N/A'}</span>
                      </div>
                      <div className="request-info-grid">
                        <div className="request-info-field">
                          <span className="request-info-label">Ngày tạo:</span>
                          <span className="request-info-value">
                            {formatDateTime(request.createdAt)}
                          </span>
                        </div>
                        <div className="request-info-field">
                          <span className="request-info-label">Ngày hiệu lực:</span>
                          <span className="request-info-value">
                            {new Date(request.effectiveDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > pageSize && (
              <div className="request-pagination">
                <button
                  className="request-pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Trước
                </button>
                <span className="request-pagination-info">
                  Trang {currentPage} / {Math.ceil(pagination.total / pageSize)}
                </span>
                <button
                  className="request-pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(pagination.total / pageSize)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        open={isRejectModalOpen}
        title="Lý do từ chối yêu cầu"
        onCancel={handleCancelRejectModal}
        onOk={handleConfirmReject}
        okText="Từ chối"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim(), loading: isReviewLoading }}
        cancelText="Hủy"
      >
        <p style={{ marginBottom: '16px' }}>
          Vui lòng nhập lý do từ chối cho yêu cầu bãi đỗ xe
          {requestBeingReviewed ? ` "${requestBeingReviewed.payload.name}"` : ''}.
        </p>
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do từ chối..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* Detail Modal */}
      <RequestDetailModal
        open={isDetailModalOpen}
        request={selectedRequest}
        onClose={() => setIsDetailModalOpen(false)}
        statusOptions={Object.values(RequestStatus).map((s) => ({
          label: getStatusLabel(s),
          value: s,
        }))}
        typeOptions={Object.values(RequestType).map((t) => ({
          label: getTypeLabel(t),
          value: t,
        }))}
        statusTagColor={{
          PENDING: 'gold',
          APPROVED: 'green',
          REJECTED: 'red',
          APPLIED: 'blue',
          FAILED: 'volcano',
          CANCELLED: 'default',
        }}
        typeTagColor={{
          CREATE: 'geekblue',
          UPDATE: 'cyan',
          DELETE: 'magenta',
        }}
      />
    </div>
  )
}

export default ManageRequest
