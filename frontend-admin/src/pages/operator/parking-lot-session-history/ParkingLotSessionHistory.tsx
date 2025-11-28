import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Card,
  Typography,
  Space,
  Select,
  DatePicker,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  Button,
  Empty,
} from 'antd'
import {
  CarOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useGetParkingLotsOperatorQuery } from '../../../features/operator/parkingLotAPI'
import { useGetParkingSessionHistoryQuery } from '../../../features/operator/parkingSessionAPI'
import type { Pagination } from '../../../types/Pagination'
import type { ParkingLot } from '../../../types/ParkingLot'
import type { ParkingLotSession } from '../../../types/ParkingLotSession'
import PaginationLoading from '../../../components/common/PaginationLoading'
import './ParkingLotSessionHistory.css'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface ParkingLotSessionHistoryResponse {
  data: ParkingLotSession[]
  pagination: Pagination
}
interface ParkingLotsListResponse {
  data: ParkingLot[]
}

const dateFormatter = (value?: string | null) =>
  value ? dayjs(value).format('HH:mm DD/MM/YYYY') : 'Chưa có'

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)

const ParkingLotSessionHistory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const getPageFromParams = () => {
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    return Number.isNaN(pageParam) || pageParam <= 0 ? 1 : pageParam
  }

  const [selectedLotId, setSelectedLotId] = useState<string>()
  const [page, setPage] = useState<number>(() => getPageFromParams())
  const [pageSize, setPageSize] = useState(5)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const end = dayjs()
    const start = end.subtract(7, 'day')
    return [start, end]
  })

  const {
    data: parkingLotsResponseData,
    isLoading: isParkingLotsLoading,
  } = useGetParkingLotsOperatorQuery({})

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

const typedParkingSessions =(parkingSessionHistoryResponse as ParkingLotSessionHistoryResponse | undefined)
const parkingSessions: ParkingLotSession[] = typedParkingSessions?.data ?? []
console.log(parkingSessions)
const paginationInfo: Pagination | undefined = typedParkingSessions?.pagination

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

const columns: ColumnsType<ParkingLotSession> = [
    {
      title: 'Biển số',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (value: string) => <span className="plate-badge">{value}</span>,
    },
    {
      title: 'Check-in',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (value: string) => dateFormatter(value),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      render: (value: string | null) => dateFormatter(value),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' ? 'green' : status === 'IN_PROGRESS' ? 'blue' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'UNPAID' ? 'orange' : 'purple'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Phí đã thu',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Còn phải thu',
      dataIndex: 'amountPayAfterCheckOut',
      key: 'amountPayAfterCheckOut',
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
  ]

  const handleLotChange = (value: string) => {
    setSelectedLotId(value)
    setPage(1)
  }

const handleDateChange = (value: [Dayjs | null, Dayjs | null] | null) => {
  if (!value || !value[0] || !value[1]) return
  setDateRange([value[0], value[1]])
  setPage(1)
}

const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) setPageSize(pagination.pageSize)
  }

  const handleRefresh = () => {
    refetchSessions()
  }

  return (
    <div className="parking-session-history-page">
      <Card className="parking-session-history-card" >
        <div className="page-header">
          <div>
            <Title level={3}>Lịch sử ra / vào bãi xe</Title>
            <Text type="secondary">
              Theo dõi lưu lượng phương tiện và doanh thu của bãi xe theo thời gian thực.
            </Text>
          </div>
          <Space className="filters" wrap>
            <Select
              placeholder="Chọn bãi xe"
              style={{ minWidth: 220 }}
              value={selectedLotId}
              loading={isParkingLotsLoading}
              onChange={handleLotChange}
              options={parkingLots.map((lot) => ({ value: lot._id, label: lot.name }))}
            />
            <RangePicker
              value={dateRange}
              onChange={handleDateChange}
              allowClear={false}
              format="DD/MM/YYYY"
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Row gutter={16} className="summary-row">
          <Col xs={24} md={6}>
            <Card className="summary-card" >
              <Statistic
                title="Tổng phiên (trang hiện tại)"
                value={summary.total}
                prefix={<CarOutlined className="summary-icon" />}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="summary-card" >
              <Statistic
                title="Đang đậu"
                value={summary.active}
                prefix={<ClockCircleOutlined className="summary-icon warning" />}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card className="summary-card" >
              <Statistic
                title="Doanh thu (trang hiện tại)"
                value={summary.revenue}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<DollarCircleOutlined className="summary-icon success" />}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
                <Card className="summary-card" >
              <Statistic title="Thời gian đậu trung bình" value={summary.avgDuration} />
            </Card>
          </Col>
        </Row>

        <Card className="session-table-card" >
          <PaginationLoading isLoading={isFetchingSessions} loadingText="Đang tải lịch sử...">
            {parkingSessions.length === 0 ? (
              <Empty
                description="Chưa có dữ liệu trong khoảng thời gian này"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={parkingSessions.map((session) => ({ ...session, key: session._id }))}
                pagination={{
                  current: paginationInfo?.currentPage ?? page,
                  pageSize: paginationInfo?.pageSize ?? pageSize,
                  total: paginationInfo?.totalItems ?? 0,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                }}
                onChange={handleTableChange}
                className="session-table"
              />
            )}
          </PaginationLoading>
        </Card>
      </Card>
    </div>
  )
}

export default ParkingLotSessionHistory