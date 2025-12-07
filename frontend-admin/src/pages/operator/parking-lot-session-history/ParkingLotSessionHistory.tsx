import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import dayjs, { type Dayjs } from 'dayjs'
import {
  CarOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useGetParkingLotsOperatorQuery } from '../../../features/operator/parkingLotAPI'
import {
  useGetParkingSessionHistoryDetailQuery,
  useGetParkingSessionHistoryQuery,
} from '../../../features/operator/parkingSessionAPI'
import type { Pagination } from '../../../types/Pagination'
import type { ParkingLot } from '../../../types/ParkingLot'
import type { ParkingLotSession } from '../../../types/ParkingLotSession'
import type { SessionImage } from '../../../types/Session.images'
import CustomModal from '../../../components/common/CustomModal'
import { DatePicker } from 'antd'
import './ParkingLotSessionHistory.css'

const { RangePicker } = DatePicker

interface ParkingLotSessionHistoryResponse {
  data: ParkingLotSession[]
  pagination: Pagination
}

interface ParkingLotSessionHistoryDetailResponse {
  data: Array<ParkingLotSession & { images?: SessionImage[] }>
}

interface ParkingLotsListResponse {
  data: ParkingLot[]
}

const dateFormatter = (value?: string | null) =>
  value ? dayjs(value).format('HH:mm DD/MM/YYYY') : 'Chưa có'

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    COMPLETED: 'Hoàn thành',
    IN_PROGRESS: 'Đang diễn ra',
    CANCELLED: 'Đã hủy',
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string): string => {
  const statusClassMap: Record<string, string> = {
    COMPLETED: 'status-completed',
    IN_PROGRESS: 'status-in-progress',
    CANCELLED: 'status-cancelled',
  }
  return statusClassMap[status] || 'status-default'
}

const getPaymentStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PAID: 'Đã thanh toán',
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Đang chờ',
  }
  return statusMap[status] || status
}

const getPaymentStatusClass = (status: string): string => {
  const statusClassMap: Record<string, string> = {
    PAID: 'payment-paid',
    UNPAID: 'payment-unpaid',
    PENDING: 'payment-pending',
  }
  return statusClassMap[status] || 'payment-default'
}

const ParkingLotSessionHistory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const getPageFromParams = () => {
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    return Number.isNaN(pageParam) || pageParam <= 0 ? 1 : pageParam
  }

  const [selectedLotId, setSelectedLotId] = useState<string>()
  const [page, setPage] = useState<number>(() => getPageFromParams())
  const pageSize = 5
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const end = dayjs()
    const start = end.subtract(7, 'day')
    return [start, end]
  })

  const { data: parkingLotsResponseData, isLoading: isParkingLotsLoading } =
    useGetParkingLotsOperatorQuery({})

  const parkingLots: ParkingLot[] =
    (parkingLotsResponseData as ParkingLotsListResponse | undefined)?.data ?? []
  const singleParkingLotId = parkingLots[0]?._id

  useEffect(() => {
    if (singleParkingLotId && !selectedLotId) {
      setSelectedLotId(singleParkingLotId)
    }
  }, [singleParkingLotId, selectedLotId])

  useEffect(() => {
    const pageFromParams = getPageFromParams()
    if (pageFromParams !== page) {
      setPage(pageFromParams)
    }
  }, [searchParams])

  useEffect(() => {
    const currentParam = searchParams.get('page')
    const normalizedPage = page.toString()
    if (currentParam !== normalizedPage) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('page', normalizedPage)
      setSearchParams(nextParams, { replace: true })
    }
  }, [page, searchParams, setSearchParams])

  const {
    data: parkingSessionHistoryResponse,
    isFetching: isFetchingSessions,
    refetch: refetchSessions,
  } = useGetParkingSessionHistoryQuery(
    selectedLotId && dateRange
      ? {
          parkingLotId: selectedLotId,
          params: {
            page,
            pageSize,
            startDate: dateRange[0].startOf('day').toISOString(),
            endDate: dateRange[1].endOf('day').toISOString(),
          },
        }
      : skipToken
  )

  const typedParkingSessions = parkingSessionHistoryResponse as
    | ParkingLotSessionHistoryResponse
    | undefined
  const parkingSessions: ParkingLotSession[] = typedParkingSessions?.data ?? []
  const paginationInfo: Pagination | undefined = typedParkingSessions?.pagination

  const { data: parkingSessionHistoryDetailResponse, isFetching: isFetchingSessionDetail } =
    useGetParkingSessionHistoryDetailQuery(
      selectedSessionId ? { sessionId: selectedSessionId } : skipToken
    )

  const sessionDetailData = parkingSessionHistoryDetailResponse as
    | ParkingLotSessionHistoryDetailResponse
    | undefined
  const sessionDetail = sessionDetailData?.data?.[0]
  const sessionImages = sessionDetail?.images ?? []

  const summary = useMemo(() => {
    if (!parkingSessions.length) {
      return {
        total: 0,
        active: 0,
        revenue: 0,
        avgDuration: '0 phút',
      }
    }

    const completed = parkingSessions.filter((session) => !!session.checkOutTime)
    const revenue = parkingSessions.reduce((sum, session) => sum + (session.amountPaid || 0), 0)
    const totalDurationMinutes = completed.reduce((sum, session) => {
      if (!session.checkInTime) return sum
      const start = dayjs(session.checkInTime)
      const end = session.checkOutTime ? dayjs(session.checkOutTime) : dayjs()
      return sum + end.diff(start, 'minute')
    }, 0)

    const avgDurationMinutes =
      completed.length > 0 ? Math.round(totalDurationMinutes / completed.length) : 0

    return {
      total: parkingSessions.length,
      active: parkingSessions.length - completed.length,
      revenue,
      avgDuration:
        avgDurationMinutes > 0
          ? `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}p`
          : '0 phút',
    }
  }, [parkingSessions])

  const handleLotChange = (value: string) => {
    setSelectedLotId(value)
    setPage(1)
  }

  const handleDateChange = (value: [Dayjs | null, Dayjs | null] | null) => {
    if (!value || !value[0] || !value[1]) return
    setDateRange([value[0], value[1]])
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', newPage.toString())
    setSearchParams(nextParams, { replace: true })
  }

  const handleViewSessionImages = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setIsImageModalOpen(true)
  }

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedSessionId(null)
  }

  const handleRefresh = () => {
    refetchSessions()
  }

  if (isParkingLotsLoading) {
    return (
      <div className="parking-session-history-page">
        <div className="session-loading">
          <div className="session-loading-spinner" />
          <p>Đang tải thông tin bãi đỗ xe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="parking-session-history-page">
      <div className="session-page-header">
        <div>
          <h1>Lịch sử ra / vào bãi xe</h1>
          <p>Theo dõi lưu lượng phương tiện và doanh thu của bãi xe theo thời gian thực</p>
        </div>
      </div>

      <div className="session-page-content">
        {/* Filters */}
        <div className="session-controls-card">
          <div className="session-filter-wrapper">
            <div className="session-filter-item">
              <label htmlFor="lot-select" className="session-filter-label">
                Bãi đỗ xe:
              </label>
              <select
                id="lot-select"
                className="session-filter-select"
                value={selectedLotId || ''}
                onChange={(e) => handleLotChange(e.target.value)}
              >
                <option value="">-- Chọn bãi đỗ xe --</option>
                {parkingLots.map((lot) => (
                  <option key={lot._id} value={lot._id}>
                    {lot.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="session-filter-item">
              <label htmlFor="date-range" className="session-filter-label">
                Khoảng thời gian:
              </label>
              <RangePicker
                id="date-range"
                value={dateRange}
                onChange={handleDateChange}
                allowClear={false}
                format="DD/MM/YYYY"
                className="session-date-picker"
              />
            </div>
            <button className="session-refresh-btn" onClick={handleRefresh}>
              <ReloadOutlined />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="session-stats-section">
          <div className="session-stat-card">
            <div className="session-stat-icon total">
              <CarOutlined />
            </div>
            <div className="session-stat-content">
              <h3>{summary.total}</h3>
              <p>Tổng phiên</p>
              <div className="session-stat-sub">Trang hiện tại</div>
            </div>
          </div>
          <div className="session-stat-card">
            <div className="session-stat-icon active">
              <ClockCircleOutlined />
            </div>
            <div className="session-stat-content">
              <h3>{summary.active}</h3>
              <p>Đang đậu</p>
              <div className="session-stat-sub">Chưa check-out</div>
            </div>
          </div>
          <div className="session-stat-card">
            <div className="session-stat-icon revenue">
              <DollarCircleOutlined />
            </div>
            <div className="session-stat-content">
              <h3>{formatCurrency(summary.revenue)}</h3>
              <p>Doanh thu</p>
              <div className="session-stat-sub">Trang hiện tại</div>
            </div>
          </div>
          <div className="session-stat-card">
            <div className="session-stat-icon duration">
              <ClockCircleOutlined />
            </div>
            <div className="session-stat-content">
              <h3>{summary.avgDuration}</h3>
              <p>Thời gian đậu TB</p>
              <div className="session-stat-sub">Trung bình</div>
            </div>
          </div>
        </div>

        {/* Session List */}
        {isFetchingSessions ? (
          <div className="session-loading">
            <div className="session-loading-spinner" />
            <p>Đang tải lịch sử...</p>
          </div>
        ) : parkingSessions.length === 0 ? (
          <div className="session-empty-state">
            <div className="session-empty-icon">🚗</div>
            <h3 className="session-empty-title">Chưa có dữ liệu</h3>
            <p className="session-empty-text">
              Chưa có dữ liệu trong khoảng thời gian này. Vui lòng thử chọn khoảng thời gian khác.
            </p>
          </div>
        ) : (
          <>
            <div className="session-list">
              {parkingSessions.map((session) => {
                const statusClass = getStatusClass(session.status)
                const statusLabel = getStatusLabel(session.status)
                const paymentStatusClass = getPaymentStatusClass(session.paymentStatus)
                const paymentStatusLabel = getPaymentStatusLabel(session.paymentStatus)
                const totalAmount = (session.amountPaid || 0) + (session.amountPayAfterCheckOut || 0)

                return (
                  <div key={session._id} className="session-item">
                    <div className="session-item-header">
                      <div className="session-item-title-section">
                        <div className="session-plate-badge">{session.plateNumber}</div>
                        <div className={`session-status-badge ${statusClass}`}>
                          <span className="session-status-dot" />
                          <span>{statusLabel}</span>
                        </div>
                        <div className={`session-payment-badge ${paymentStatusClass}`}>
                          <span>{paymentStatusLabel}</span>
                        </div>
                      </div>
                      <button
                        className="session-view-images-btn"
                        onClick={() => handleViewSessionImages(session._id)}
                        title="Xem ảnh"
                      >
                        <EyeOutlined />
                        <span>Xem ảnh</span>
                      </button>
                    </div>

                    <div className="session-item-body">
                      <div className="session-time-info">
                        <div className="session-time-item">
                          <CheckCircleOutlined className="session-time-icon check-in" />
                          <div>
                            <span className="session-time-label">Check-in</span>
                            <span className="session-time-value">
                              {dateFormatter(session.checkInTime)}
                            </span>
                          </div>
                        </div>
                        <div className="session-time-item">
                          <CloseCircleOutlined className="session-time-icon check-out" />
                          <div>
                            <span className="session-time-label">Check-out</span>
                            <span className="session-time-value">
                              {dateFormatter(session.checkOutTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {session.subscriptionId ? (
                        <div className="session-subscription-info">
                          <div className="session-subscription-badge">
                            <CrownOutlined className="session-subscription-icon" />
                            <span>Khách dùng vé tháng</span>
                          </div>
                        </div>
                      ) : session.reservationId ? (
                        <div className="session-reservation-info">
                          <div className="session-reservation-badge">
                            <CalendarOutlined className="session-reservation-icon" />
                            <span>Đặt trước</span>
                          </div>
                        </div>
                      ) : (
                        <div className="session-payment-info">
                          <div className="session-payment-item">
                            <span className="session-payment-label">Phí đã thu:</span>
                            <span className="session-payment-value paid">
                              {formatCurrency(session.amountPaid)}
                            </span>
                          </div>
                          <div className="session-payment-item">
                            <span className="session-payment-label">Phí đã trả sau check-out:</span>
                            <span className="session-payment-value unpaid">
                              {formatCurrency(session.amountPayAfterCheckOut)}
                            </span>
                          </div>
                          <div className="session-payment-item">
                            <span className="session-payment-label">Tổng phí:</span>
                            <span className="session-payment-value total">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {paginationInfo && paginationInfo.totalItems > pageSize && (
              <div className="session-pagination">
                <button
                  className="session-pagination-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Trước
                </button>
                <span className="session-pagination-info">
                  Trang {paginationInfo.currentPage || page} /{' '}
                  {Math.ceil(paginationInfo.totalItems / pageSize)}
                </span>
                <button
                  className="session-pagination-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={(paginationInfo.currentPage || page) >= Math.ceil(paginationInfo.totalItems / pageSize)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Modal */}
      <CustomModal
        open={isImageModalOpen}
        onClose={handleCloseImageModal}
        title="Ảnh check-in / check-out"
        width="900px"
        loading={isFetchingSessionDetail}
      >
        {isFetchingSessionDetail ? (
          <div className="session-image-loading">
            <div className="session-image-loading-spinner" />
            <p>Đang tải ảnh...</p>
          </div>
        ) : sessionImages.length === 0 ? (
          <div className="session-image-empty">
            <div className="session-image-empty-icon">📷</div>
            <p>Không có ảnh cho phiên này</p>
          </div>
        ) : (
          <div className="session-images-grid">
            {sessionImages.map((image) => (
              <div key={image.id} className="session-image-card">
                <img src={image.url} alt={image.description || 'Ảnh phiên gửi xe'} />
                <span className="session-image-description">
                  {image.description || 'Không có mô tả'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CustomModal>
    </div>
  )
}

export default ParkingLotSessionHistory
