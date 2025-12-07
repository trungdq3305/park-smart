import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import dayjs, { type Dayjs } from 'dayjs'
import { useGetParkingLotsOperatorQuery } from '../../../features/operator/parkingLotAPI'
import {
  useGetParkingSessionHistoryDetailQuery,
  useGetParkingSessionHistoryQuery,
  useCalculateCheckoutFeeMutation,
  useGetActivePricingPoliciesQuery,
} from '../../../features/operator/parkingSessionAPI'
import type { Pagination } from '../../../types/Pagination'
import type { ParkingLot } from '../../../types/ParkingLot'
import type { ParkingLotSession } from '../../../types/ParkingLotSession'
import type { SessionImage } from '../../../types/Session.images'
import {
  SessionFilters,
  SessionStats,
  SessionList,
  SessionEmptyState,
  SessionPagination,
  SessionDetailModal,
} from '../../../components/session-history'
import './ParkingLotSessionHistory.css'

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
  const [selectedSession, setSelectedSession] = useState<ParkingLotSession | null>(null)
  const [plateNumberSearch, setPlateNumberSearch] = useState<string>('')
  const [calculateFeeResult, setCalculateFeeResult] = useState<any>(null)
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)
  const [selectedPricingPolicyId, setSelectedPricingPolicyId] = useState<string | null>(null)
  const [debouncedPlateNumberSearch, setDebouncedPlateNumberSearch] = useState<string>('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Debounce plate number search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedPlateNumberSearch(plateNumberSearch)
      // Reset to page 1 when search changes
      setPage(1)
    }, 500) // 500ms delay

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [plateNumberSearch])

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
            ...(debouncedPlateNumberSearch.trim() && {
              plateNumber: debouncedPlateNumberSearch.trim(),
            }),
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

  // Get pricing policies for the selected session's parking lot
  const parkingLotIdForPricing =
    selectedSession && typeof selectedSession.parkingLotId === 'object'
      ? selectedSession.parkingLotId._id
      : selectedSession?.parkingLotId || null

  const { data: pricingPolicies } = useGetActivePricingPoliciesQuery(
    parkingLotIdForPricing || skipToken
  )
  const [calculateFee] = useCalculateCheckoutFeeMutation()

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

  const handlePlateNumberSearchChange = (value: string) => {
    setPlateNumberSearch(value)
    // Don't reset page here, let debounce handle it
  }

  const handleClearPlateNumberSearch = () => {
    setPlateNumberSearch('')
    setDebouncedPlateNumberSearch('')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', newPage.toString())
    setSearchParams(nextParams, { replace: true })
  }

  const handleViewSessionImages = (sessionId: string, session?: ParkingLotSession) => {
    setSelectedSessionId(sessionId)
    setSelectedSession(session || null)
    setIsImageModalOpen(true)
    setCalculateFeeResult(null)
  }

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedSessionId(null)
    setSelectedSession(null)
    setCalculateFeeResult(null)
    setSelectedPricingPolicyId(null)
  }

  const handleCalculateFee = async () => {
    if (!selectedSession || !sessionDetail) return

    try {
      setIsCalculatingFee(true)
      setCalculateFeeResult(null)

      // Lấy parkingLotId từ selectedLotId
      const parkingLotId = selectedLotId

      // Sử dụng pricingPolicyId đã chọn hoặc lấy đầu tiên
      const pricingPolicyId =
        selectedPricingPolicyId ||
        (pricingPolicies && Array.isArray(pricingPolicies) && pricingPolicies.length > 0
          ? pricingPolicies[0]._id
          : null)

      if (!pricingPolicyId) {
        alert('Vui lòng chọn chính sách giá.')
        setIsCalculatingFee(false)
        return
      }

      // Tạo requestData với pricingPolicyId
      const requestData: any = {
        pricingPolicyId,
      }

      // Xác định và thêm nfcUid hoặc identifier theo logic (sử dụng sessionDetail)
      if (sessionDetail.guestCardId) {
        // Nếu có guestCardId, thêm nfcUid và set identifier = "null" (string)
        const nfcUid =
          typeof sessionDetail.guestCardId === 'object' ? sessionDetail.guestCardId.nfcUid : null
        requestData.nfcUid = nfcUid || 'null'
        requestData.identifier = 'null'
      } else if (sessionDetail.reservationId) {
        // Nếu có reservationId, thêm identifier và set nfcUid = "null" (string)
        const identifier =
          typeof sessionDetail.reservationId === 'object'
            ? sessionDetail.reservationId.reservationIdentifier
            : null
        requestData.identifier = identifier || 'null'
        requestData.nfcUid = 'null'
      } else if (sessionDetail.subscriptionId) {
        // Nếu có subscriptionId, thêm identifier và set nfcUid = "null" (string)
        const identifier =
          typeof sessionDetail.subscriptionId === 'object'
            ? sessionDetail.subscriptionId.subscriptionIdentifier
            : null
        requestData.identifier = identifier || 'null'
        requestData.nfcUid = 'null'
      }

      console.log('Request data:', requestData)
      console.log('SessionDetail data:', {
        guestCardId: sessionDetail.guestCardId,
        reservationId: sessionDetail.reservationId,
        subscriptionId: sessionDetail.subscriptionId,
      })
      if (sessionDetail.guestCardId) {
        console.log('guestCardId details:', {
          type: typeof sessionDetail.guestCardId,
          isObject: typeof sessionDetail.guestCardId === 'object',
          nfcUid:
            typeof sessionDetail.guestCardId === 'object'
              ? sessionDetail.guestCardId.nfcUid
              : 'N/A',
        })
      }

      const result = await calculateFee({
        parkingLotId,
        data: requestData,
      }).unwrap()

      setCalculateFeeResult(result)
    } catch (error: any) {
      console.error('Error calculating fee:', error)
      alert(
        error?.data?.message ||
          error?.message ||
          'Có lỗi xảy ra khi tính phí. Vui lòng thử lại sau.'
      )
    } finally {
      setIsCalculatingFee(false)
    }
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
        <SessionFilters
          parkingLots={parkingLots}
          selectedLotId={selectedLotId}
          onLotChange={handleLotChange}
          dateRange={dateRange}
          onDateChange={handleDateChange}
          plateNumberSearch={plateNumberSearch}
          onPlateNumberSearchChange={handlePlateNumberSearchChange}
          onClearPlateNumberSearch={handleClearPlateNumberSearch}
          onRefresh={handleRefresh}
        />

        <SessionStats
          total={summary.total}
          active={summary.active}
          revenue={summary.revenue}
          avgDuration={summary.avgDuration}
        />

        {isFetchingSessions ? (
          <div className="session-loading">
            <div className="session-loading-spinner" />
            <p>Đang tải lịch sử...</p>
          </div>
        ) : parkingSessions.length === 0 ? (
          <SessionEmptyState />
        ) : (
          <>
            <SessionList sessions={parkingSessions} onViewDetails={handleViewSessionImages} />
            <SessionPagination
              pagination={paginationInfo}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <SessionDetailModal
        open={isImageModalOpen}
        onClose={handleCloseImageModal}
        selectedSession={selectedSession}
        sessionImages={sessionImages}
        isFetchingSessionDetail={isFetchingSessionDetail}
        pricingPolicies={pricingPolicies}
        selectedPricingPolicyId={selectedPricingPolicyId}
        onSelectPolicy={setSelectedPricingPolicyId}
        onCalculateFee={handleCalculateFee}
        isCalculatingFee={isCalculatingFee}
        calculateFeeResult={calculateFeeResult}
      />
    </div>
  )
}

export default ParkingLotSessionHistory
