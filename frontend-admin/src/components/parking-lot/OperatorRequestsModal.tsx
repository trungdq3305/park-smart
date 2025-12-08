import React, { useMemo } from 'react'
import { CustomModal } from '../common'

interface RequestPayload {
  name?: string
  totalCapacityEachLevel?: number
  totalLevel?: number
  bookingSlotDurationHours?: number
  bookableCapacity?: number
  leasedCapacity?: number
  walkInCapacity?: number
}

interface ParkingLotRequestItem {
  _id: string
  status?: string
  requestType?: string
  effectiveDate?: string
  createdAt?: string
  rejectionReason?: string
  payload?: RequestPayload
}

interface OperatorRequestsModalProps {
  open: boolean
  onClose: () => void
  requests: ParkingLotRequestItem[]
  loading?: boolean
}

const OperatorRequestsModal: React.FC<OperatorRequestsModalProps> = ({
  open,
  onClose,
  requests,
  loading = false,
}) => {
  const sortedRequests = useMemo(() => [...requests].reverse(), [requests])

  const formatDate = (value?: string) => {
    if (!value) return 'Chưa xác định'
    return new Date(value).toLocaleDateString('vi-VN')
  }

  return (
    <CustomModal open={open} onClose={onClose} title="Các yêu cầu đã gửi" width={800}>
      <div className="parking-lot-request-modal">
        {loading ? (
          <div className="parking-lot-request-loading">Đang tải yêu cầu...</div>
        ) : sortedRequests.length === 0 ? (
          <div className="parking-lot-request-empty">Chưa có yêu cầu nào.</div>
        ) : (
          <div className="parking-lot-request-list">
            {sortedRequests.map((req) => (
              <div key={req._id} className="parking-lot-request-card">
                <div className="parking-lot-request-header">
                  <div className="parking-lot-request-title">{req.payload?.name || 'Bãi đỗ'}</div>
                  <span
                    className={`parking-lot-request-badge status-${req.status?.toLowerCase?.() || 'pending'}`}
                  >
                    {req.status || 'PENDING'}
                  </span>
                </div>
                <div className="parking-lot-request-grid">
                  <div className="parking-lot-request-field">
                    <div className="label">Loại yêu cầu</div>
                    <div className="value">{req.requestType || 'N/A'}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Tên bãi</div>
                    <div className="value">{req.payload?.name || 'Chưa cung cấp'}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Ngày tạo</div>
                    <div className="value">{formatDate(req.createdAt)}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Sức chứa/tầng</div>
                    <div className="value">{req.payload?.totalCapacityEachLevel ?? '—'}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Tổng tầng</div>
                    <div className="value">{req.payload?.totalLevel ?? '—'}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Slot (giờ)</div>
                    <div className="value">{req.payload?.bookingSlotDurationHours ?? '—'}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Đặt trước</div>
                    <div className="value">{req.payload?.bookableCapacity ?? '—'}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Thuê</div>
                    <div className="value">{req.payload?.leasedCapacity ?? '—'}</div>
                  </div>
                  <div className="parking-lot-request-field">
                    <div className="label">Vãng lai</div>
                    <div className="value">{req.payload?.walkInCapacity ?? '—'}</div>
                  </div>
                  {req.status === 'REJECTED' && (
                    <div className="parking-lot-request-field full">
                      <div className="label">Lý do từ chối</div>
                      <div className="value">{req.rejectionReason || 'Không có'}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomModal>
  )
}

export default OperatorRequestsModal

