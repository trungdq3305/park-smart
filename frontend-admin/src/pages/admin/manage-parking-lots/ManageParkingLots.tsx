import React, { useMemo, useState } from 'react'
import { useGetParkingLotsAdminQuery } from '../../../features/admin/parkinglotAPI'
import type { ParkingLot } from '../../../types/ParkingLot'
import ParkingLotDetails from '../../../components/parking-lot/ParkingLotDetails'
import {
  CarOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import './ManageParkingLots.css'

type ParkingLotStatus = 'APPLIED' | 'APPROVED' | 'CANCELLED' | 'FAILED' | 'PENDING' | 'REJECTED'

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    APPLIED: 'Đã nộp',
    APPROVED: 'Đã duyệt',
    CANCELLED: 'Đã hủy',
    FAILED: 'Thất bại',
    PENDING: 'Đang chờ',
    REJECTED: 'Đã từ chối',
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string): string => {
  const statusClassMap: Record<string, string> = {
    APPLIED: 'status-applied',
    APPROVED: 'status-approved',
    CANCELLED: 'status-cancelled',
    FAILED: 'status-failed',
    PENDING: 'status-pending',
    REJECTED: 'status-rejected',
  }
  return statusClassMap[status] || 'status-default'
}

const ManageParkingLots: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ParkingLotStatus>('APPROVED')
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null)
  const { data, isLoading, error } = useGetParkingLotsAdminQuery({
    status: statusFilter,
    page: 1,
    pageSize: 10,
  })

  // Kiểm tra xem error có phải là 404 không
  const isNotFoundError =
    error &&
    ((error as any)?.status === 404 ||
      (error as any)?.data?.statusCode === 404 ||
      (error as any)?.statusCode === 404)

  const parkingLots: ParkingLot[] = isNotFoundError
    ? []
    : (data as { data?: ParkingLot[] })?.data || []

  const stats = useMemo(() => {
    const total = parkingLots.length
    let applied = 0
    let approved = 0
    let cancelled = 0
    let failed = 0
    let pending = 0
    let rejected = 0

    parkingLots.forEach((lot) => {
      const status = lot.parkingLotStatus
      if (status === 'APPLIED') applied += 1
      if (status === 'APPROVED') approved += 1
      if (status === 'CANCELLED') cancelled += 1
      if (status === 'FAILED') failed += 1
      if (status === 'PENDING') pending += 1
      if (status === 'REJECTED') rejected += 1
    })

    return { total, applied, approved, cancelled, failed, pending, rejected }
  }, [parkingLots])

  const filteredLots = useMemo(() => {
    return parkingLots.filter((lot) => lot.parkingLotStatus === statusFilter)
  }, [parkingLots, statusFilter])

  const toggleExpand = (lotId: string) => {
    setExpandedLotId(expandedLotId === lotId ? null : lotId)
  }

  if (isLoading) {
    return (
      <div className="manage-parking-lots-page">
        <div className="parking-lots-loading">
          <div className="parking-lots-loading-spinner" />
          <p>Đang tải danh sách bãi đỗ xe...</p>
        </div>
      </div>
    )
  }

  // Chỉ hiển thị error state cho các lỗi khác 404
  if (error && !isNotFoundError) {
    return (
      <div className="manage-parking-lots-page">
        <div className="parking-lots-error">
          <span className="parking-lots-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách bãi đỗ xe. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-parking-lots-page">
      <div className="parking-lots-page-header">
        <div>
          <h1>Quản lý bãi đỗ xe</h1>
          <p>Xem và theo dõi tất cả các bãi đỗ xe trong hệ thống</p>
        </div>
      </div>

      <div className="parking-lots-page-content">
        {/* Stats Section */}
        <div className="parking-lots-stats-section">
          <div className="parking-lots-stat-card">
            <div className="parking-lots-stat-icon total">
              <CarOutlined />
            </div>
            <div className="parking-lots-stat-content">
              <h3>{stats.total}</h3>
              <p>Tổng bãi đỗ</p>
              <div className="parking-lots-stat-sub">Tất cả bãi đỗ</div>
            </div>
          </div>
          <div className="parking-lots-stat-card">
            <div className="parking-lots-stat-icon applied">
              <CheckCircleOutlined />
            </div>
            <div className="parking-lots-stat-content">
              <h3>{stats.applied}</h3>
              <p>Đã nộp</p>
              <div className="parking-lots-stat-sub">Đã nộp đơn</div>
            </div>
          </div>
          <div className="parking-lots-stat-card">
            <div className="parking-lots-stat-icon approved">
              <CheckCircleOutlined />
            </div>
            <div className="parking-lots-stat-content">
              <h3>{stats.approved}</h3>
              <p>Đã duyệt</p>
              <div className="parking-lots-stat-sub">Đã được duyệt</div>
            </div>
          </div>
          <div className="parking-lots-stat-card">
            <div className="parking-lots-stat-icon pending">
              <ThunderboltOutlined />
            </div>
            <div className="parking-lots-stat-content">
              <h3>{stats.pending}</h3>
              <p>Đang chờ</p>
              <div className="parking-lots-stat-sub">Đang chờ duyệt</div>
            </div>
          </div>
          <div className="parking-lots-stat-card">
            <div className="parking-lots-stat-icon rejected">
              <UserOutlined />
            </div>
            <div className="parking-lots-stat-content">
              <h3>{stats.rejected}</h3>
              <p>Đã từ chối</p>
              <div className="parking-lots-stat-sub">Bị từ chối</div>
            </div>
          </div>
          <div className="parking-lots-stat-card">
            <div className="parking-lots-stat-icon cancelled">
              <UserOutlined />
            </div>
            <div className="parking-lots-stat-content">
              <h3>{stats.cancelled}</h3>
              <p>Đã hủy</p>
              <div className="parking-lots-stat-sub">Đã bị hủy</div>
            </div>
          </div>
          <div className="parking-lots-stat-card">
            <div className="parking-lots-stat-icon failed">
              <UserOutlined />
            </div>
            <div className="parking-lots-stat-content">
              <h3>{stats.failed}</h3>
              <p>Thất bại</p>
              <div className="parking-lots-stat-sub">Thất bại</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="parking-lots-controls-card">
          <div className="parking-lots-filter-wrapper">
            <label htmlFor="status-filter" className="parking-lots-filter-label">
              Lọc theo trạng thái:
            </label>
            <select
              id="status-filter"
              className="parking-lots-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ParkingLotStatus)}
            >
              <option value="APPLIED">Đã nộp</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PENDING">Đang chờ</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="FAILED">Thất bại</option>
            </select>
          </div>
          <div className="parking-lots-counter">
            Đang hiển thị <strong>{filteredLots.length}</strong> / {stats.total} bãi đỗ
          </div>
        </div>

        {/* Parking Lots List */}
        {filteredLots.length === 0 ? (
          <div className="parking-lots-empty-state">
            <div className="parking-lots-empty-icon">🚗</div>
            <h3 className="parking-lots-empty-title">Chưa có bãi đỗ xe nào</h3>
            <p className="parking-lots-empty-text">
              {`Không có bãi đỗ xe với trạng thái "${getStatusLabel(statusFilter)}".`}
            </p>
          </div>
        ) : (
          <div className="parking-lots-list">
            {filteredLots.map((lot) => {
              const totalCapacity = lot.totalCapacityEachLevel * lot.totalLevel
              const occupied = totalCapacity - lot.availableSpots
              const occupancy =
                totalCapacity === 0 ? 0 : Math.round((occupied / totalCapacity) * 100)
              const isExpanded = expandedLotId === lot._id
              const statusClass = getStatusClass(lot.parkingLotStatus)
              const statusLabel = getStatusLabel(lot.parkingLotStatus)

              return (
                <div key={lot._id} className="parking-lot-item">
                  <div className="parking-lot-item-header">
                    <div className="parking-lot-item-title-section">
                      <h3 className="parking-lot-item-title">{lot.name || 'N/A'}</h3>
                      <div className={`parking-lot-status-badge ${statusClass}`}>
                        <span className="parking-lot-status-dot" />
                        <span>{statusLabel}</span>
                      </div>
                    </div>
                    <div className="parking-lot-item-summary">
                      <div className="parking-lot-summary-item">
                        <span className="parking-lot-summary-label">Sức chứa</span>
                        <span className="parking-lot-summary-value">{totalCapacity}</span>
                      </div>
                      <div className="parking-lot-summary-item">
                        <span className="parking-lot-summary-label">Tỷ lệ lấp đầy</span>
                        <span className="parking-lot-summary-value">{occupancy}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="parking-lot-item-body">
                    <div className="parking-lot-item-info">
                      <div className="parking-lot-info-item">
                        <EnvironmentOutlined />
                        <span>{lot.addressId?.fullAddress || 'N/A'}</span>
                      </div>
                      <div className="parking-lot-info-item">
                        <span className="parking-lot-info-label">Số tầng:</span>
                        <span className="parking-lot-info-value">{lot.totalLevel}</span>
                      </div>
                      <div className="parking-lot-info-item">
                        <span className="parking-lot-info-label">Chỗ còn trống:</span>
                        <span className="parking-lot-info-value">{lot.availableSpots}</span>
                      </div>
                    </div>

                    <button
                      className="parking-lot-expand-btn"
                      onClick={() => toggleExpand(lot._id)}
                    >
                      {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="parking-lot-item-details">
                      <ParkingLotDetails lot={lot} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageParkingLots
