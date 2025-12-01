import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Skeleton,
  Statistic,
  Tag,
  Typography,
  Progress,
} from 'antd'
import {
  DollarOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  SwapOutlined,
  ProfileOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import Cookies from 'js-cookie'
import { skipToken } from '@reduxjs/toolkit/query'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  Bar,
  Line,
  Pie,
  PieChart,
  Cell,
} from 'recharts'
import { useGetDashboardAdminQuery } from '../../../features/operator/dashboardAPI'
import './dashboardOperator.css'

type TimeRange = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

type DashboardQueryArgs =
  | {
      parkingLotId: string
      timeRange: TimeRange
      targetDate: string
    }
  | typeof skipToken

const timeRangeOptions: { label: string; value: TimeRange; picker: 'date' | 'week' | 'month' | 'year' }[] = [
  { label: 'Theo ngày', value: 'DAY', picker: 'date' },
  { label: 'Theo tuần', value: 'WEEK', picker: 'week' },
  { label: 'Theo tháng', value: 'MONTH', picker: 'month' },
  { label: 'Theo năm', value: 'YEAR', picker: 'year' },
]

const getFormattedTargetDate = (value: Dayjs, timeRange: TimeRange) => {
  switch (timeRange) {
    case 'WEEK':
      return value.startOf('week').format('YYYY-MM-DD')
    case 'MONTH':
      return value.startOf('month').format('YYYY-MM-DD')
    case 'YEAR':
      return value.startOf('year').format('YYYY-MM-DD')
    default:
      return value.format('YYYY-MM-DD')
  }
}

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const getPercentage = (value: number, total: number) => {
  if (!total) {
    return 0
  }
  return Number(((value / total) * 100).toFixed(1))
}

const getErrorMessage = (err: FetchBaseQueryError | SerializedError | undefined) => {
  if (!err) return ''
  if ('status' in err) {
    const data = err.data as { message?: string }
    return data?.message ?? ''
  }

  return err.message ?? ''
}

const DashboardOperator: React.FC = () => {
  const parkingLotId = Cookies.get('parkingLotId') || ''
  const [timeRange, setTimeRange] = useState<TimeRange>('DAY')
  const [targetDate, setTargetDate] = useState<Dayjs>(dayjs())

  const targetDateString = useMemo(
    () => getFormattedTargetDate(targetDate, timeRange),
    [targetDate, timeRange]
  )

  const shouldSkip = !parkingLotId
  const queryArgs: DashboardQueryArgs = shouldSkip
    ? skipToken
    : {
        parkingLotId,
        timeRange,
        targetDate: targetDateString,
      }

  const { data, isLoading, isFetching, error, refetch } = useGetDashboardAdminQuery(queryArgs)
  const apiErrorMessage = getErrorMessage(error)

  const summary = data?.summary
  const chartData = data?.chartData ?? []

  const revenuePieData = [
    {
      name: 'Gửi lượt',
      value: summary?.revenueBreakdown?.walkIn ?? 0,
      color: '#5b8def',
    },
    {
      name: 'Đặt chỗ',
      value: summary?.revenueBreakdown?.reservation ?? 0,
      color: '#9254de',
    },
    {
      name: 'Gói tháng',
      value: summary?.revenueBreakdown?.subscription ?? 0,
      color: '#13c2c2',
    },
  ]

  const refundPieData = [
    {
      name: 'Gửi lượt',
      value: summary?.refundBreakdown?.walkIn ?? 0,
      color: '#fa8c16',
    },
    {
      name: 'Đặt chỗ',
      value: summary?.refundBreakdown?.reservation ?? 0,
      color: '#eb2f96',
    },
    {
      name: 'Gói tháng',
      value: summary?.refundBreakdown?.subscription ?? 0,
      color: '#faad14',
    },
  ]

  const totalRevenueBreakdown =
    (summary?.revenueBreakdown?.subscription || 0) +
    (summary?.revenueBreakdown?.reservation || 0) +
    (summary?.revenueBreakdown?.walkIn || 0)

  const totalRefundBreakdown =
    (summary?.refundBreakdown?.subscription || 0) +
    (summary?.refundBreakdown?.reservation || 0) +
    (summary?.refundBreakdown?.walkIn || 0)

  const renderSummaryCards = () => {
    const cards = [
      {
        title: 'Tổng doanh thu',
        value: summary?.totalRevenue ?? 0,
        formatter: formatCurrency,
        icon: <DollarOutlined />,
      },
      {
        title: 'Tổng lượt check-in',
        value: summary?.totalCheckIns ?? 0,
        formatter: (value: number) => value.toLocaleString('vi-VN'),
        icon: <SwapOutlined />,
      },
      {
        title: 'Lượt đặt chỗ',
        value: summary?.totalReservations ?? 0,
        formatter: (value: number) => value.toLocaleString('vi-VN'),
        icon: <ProfileOutlined />,
      },
      {
        title: 'Thời gian gửi xe TB',
        value: summary?.avgParkingDurationMinutes ?? 0,
        formatter: (value: number) => `${Math.round(value)} phút`,
        icon: <ClockCircleOutlined />,
      },
    ]

    return (
      <Row gutter={[16, 16]} className="summary-grid">
        {cards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card className="summary-card" bordered={false}>
              <div className="summary-card__icon">{card.icon}</div>
              <Statistic
                title={card.title}
                value={card.value}
                formatter={(value) => card.formatter(Number(value))}
              />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  const renderChart = () => (
    <Card
      title="Biểu đồ doanh thu & lưu lượng"
      className="chart-card"
      bordered={false}
      extra={<Tag color="blue">{timeRangeOptions.find((item) => item.value === timeRange)?.label}</Tag>}
    >
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <RechartsTooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name="Doanh thu"
            fill="#5b8def"
            radius={[6, 6, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="checkIns"
            name="Lượt check-in"
            stroke="#66d89c"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  )

  const renderBreakdownCard = (
    title: string,
    dataSource: { label: string; value: number; color: string }[],
    total: number
  ) => (
    <Card title={title} bordered={false} className="breakdown-card">
      {dataSource.map((item) => (
        <div className="breakdown-row" key={item.label}>
          <div>
            <Tag color={item.color}>{item.label}</Tag>
            <div className="breakdown-value">{formatCurrency(item.value)}</div>
          </div>
          <Progress
            percent={getPercentage(item.value, total)}
            strokeColor={item.color}
            showInfo={false}
            className="breakdown-progress"
          />
        </div>
      ))}
      <div className="breakdown-total">
        <span>Tổng cộng</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </Card>
  )

  const renderInsights = () => (
    <Card title="Chỉ số nổi bật" bordered={false} className="insights-card">
      <div className="insight-item">
        <div>
          <p>Lượt đăng ký mới</p>
          <h3>{summary?.newSubscriptions?.toLocaleString('vi-VN') ?? 0}</h3>
        </div>
        <UserSwitchOutlined className="insight-icon" />
      </div>
      <div className="insight-item">
        <div>
          <p>Tổng hoàn tiền</p>
          <h3>{formatCurrency(summary?.totalRefunded ?? 0)}</h3>
        </div>
        <FieldTimeOutlined className="insight-icon" />
      </div>
      <div className="insight-item">
        <div>
          <p>Lượt check-out</p>
          <h3>{summary?.totalCheckOuts?.toLocaleString('vi-VN') ?? 0}</h3>
        </div>
        <RiseOutlined className="insight-icon" />
      </div>
    </Card>
  )

  const content = () => {
    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 10 }} />
    }

    if (!data) {
      return <Empty description="Chưa có dữ liệu thống kê cho bãi xe này" />
    }

    return (
      <>
        {renderSummaryCards()}
        <Row gutter={[16, 16]} className="chart-section">
          <Col xs={24} xl={14}>
            {renderChart()}
          </Col>
          <Col xs={24} xl={10}>
            {renderInsights()}
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="chart-section">
          <Col xs={24} md={12}>
            <Card title="Cơ cấu doanh thu"  className="pie-card">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={revenuePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                  >
                    {revenuePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Kênh: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Cơ cấu hoàn tiền"  className="pie-card">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={refundPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                  >
                    {refundPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Kênh: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {renderBreakdownCard(
              'Doanh thu theo kênh',
              [
                {
                  label: 'Gửi lượt',
                  value: summary?.revenueBreakdown?.walkIn ?? 0,
                  color: 'blue',
                },
                {
                  label: 'Đặt chỗ',
                  value: summary?.revenueBreakdown?.reservation ?? 0,
                  color: 'purple',
                },
                {
                  label: 'Gói tháng',
                  value: summary?.revenueBreakdown?.subscription ?? 0,
                  color: 'cyan',
                },
              ],
              totalRevenueBreakdown
            )}
          </Col>
          <Col xs={24} md={12}>
            {renderBreakdownCard(
              'Hoàn tiền theo kênh',
              [
                {
                  label: 'Gửi lượt',
                  value: summary?.refundBreakdown?.walkIn ?? 0,
                  color: 'volcano',
                },
                {
                  label: 'Đặt chỗ',
                  value: summary?.refundBreakdown?.reservation ?? 0,
                  color: 'magenta',
                },
                {
                  label: 'Gói tháng',
                  value: summary?.refundBreakdown?.subscription ?? 0,
                  color: 'gold',
                },
              ],
              totalRefundBreakdown
            )}
          </Col>
        </Row>
      </>
    )
  }

  return (
    <div className="operator-dashboard">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Tổng quan vận hành</p>
          <Typography.Title level={3} className="dashboard-title">
            {data?.parkingLotInfo?.name || 'Chưa chọn bãi đỗ xe'}
          </Typography.Title>
          {data?.parkingLotInfo?.addressId?.fullAddress && (
            <div className="parking-meta">
              <span>{data.parkingLotInfo.addressId.fullAddress}</span>
              {data.parkingLotInfo.addressId.wardId?.wardName && (
                <Tag>{data.parkingLotInfo.addressId.wardId.wardName}</Tag>
              )}
            </div>
          )}
        </div>
        <div className="filter-bar">
          <Select
            value={timeRange}
            options={timeRangeOptions}
            onChange={(value) => setTimeRange(value)}
            popupMatchSelectWidth={200}
          />
          <DatePicker
            value={targetDate}
            format="DD/MM/YYYY"
            picker={timeRangeOptions.find((item) => item.value === timeRange)?.picker}
            onChange={(value) => value && setTargetDate(value)}
            allowClear={false}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            Làm mới
          </Button>
        </div>
      </div>
      {error && (
        <Alert
          type="error"
          message={apiErrorMessage || 'Không thể tải dữ liệu dashboard'}
          description={apiErrorMessage ? undefined : 'Vui lòng thử lại sau hoặc liên hệ quản trị viên.'}
          showIcon
          className="dashboard-alert"
        />
      )}
      {content()}
    </div>
  )
}

export default DashboardOperator