import { useMemo, useState } from 'react'
import {
  DollarOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
  RiseOutlined,
  ClockCircleOutlined,
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

const timeRangeOptions: {
  label: string
  value: TimeRange
  picker: 'date' | 'week' | 'month' | 'year'
}[] = [
  { label: 'Theo ngày', value: 'DAY', picker: 'date' },
  { label: 'Theo tuần', value: 'WEEK', picker: 'date' },
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
  const [timeRange, setTimeRange] = useState<TimeRange>('WEEK')
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

  return (
    <div className="dashboard-operator-page">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <p className="dashboard-eyebrow">Tổng quan vận hành</p>
            <h1 className="dashboard-title">
              {data?.parkingLotInfo?.name || 'Chưa chọn bãi đỗ xe'}
            </h1>
            {data?.parkingLotInfo?.addressId?.fullAddress && (
              <div className="dashboard-meta">
                <span className="dashboard-address">
                  {data.parkingLotInfo.addressId.fullAddress}
                </span>
                {data.parkingLotInfo.addressId.wardId?.wardName && (
                  <span className="dashboard-ward">
                    {data.parkingLotInfo.addressId.wardId.wardName}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="dashboard-filters">
            <div className="dashboard-filter-group">
              <label className="dashboard-filter-label">Khoảng thời gian:</label>
              <select
                className="dashboard-filter-select"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="dashboard-filter-group">
              <label className="dashboard-filter-label">Ngày:</label>
              <input
                type={timeRange === 'MONTH' ? 'month' : timeRange === 'YEAR' ? 'year' : 'date'}
                className="dashboard-date-input"
                value={
                  timeRange === 'MONTH'
                    ? targetDate.format('YYYY-MM')
                    : timeRange === 'YEAR'
                      ? targetDate.format('YYYY')
                      : targetDate.format('YYYY-MM-DD')
                }
                onChange={(e) => {
                  const value = e.target.value
                  if (timeRange === 'MONTH') {
                    setTargetDate(dayjs(value + '-01'))
                  } else if (timeRange === 'YEAR') {
                    setTargetDate(dayjs(value + '-01-01'))
                  } else {
                    setTargetDate(dayjs(value))
                  }
                }}
              />
            </div>
            <button
              className="dashboard-refresh-btn"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <div className="dashboard-loading-spinner" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <ReloadOutlined />
                  <span>Làm mới</span>
                </>
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="dashboard-error-alert">
            <div className="dashboard-error-icon">⚠️</div>
            <div className="dashboard-error-content">
              <h4>Không thể tải dữ liệu</h4>
              <p>{apiErrorMessage || 'Vui lòng thử lại sau hoặc liên hệ quản trị viên.'}</p>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner-large" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : !data ? (
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-icon">📊</div>
          <h3>Chưa có dữ liệu</h3>
          <p>Chưa có dữ liệu thống kê cho bãi xe này</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Summary Cards */}
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon revenue">
                <DollarOutlined />
              </div>
              <div className="dashboard-stat-content">
                <h3>{formatCurrency(summary?.totalRevenue ?? 0)}</h3>
                <p>Tổng doanh thu</p>
                <div className="dashboard-stat-sub">Trong khoảng thời gian đã chọn</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon checkins">
                <SwapOutlined />
              </div>
              <div className="dashboard-stat-content">
                <h3>{(summary?.totalCheckIns ?? 0).toLocaleString('vi-VN')}</h3>
                <p>Tổng lượt check-in</p>
                <div className="dashboard-stat-sub">Số lượt vào bãi</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon reservations">
                <ProfileOutlined />
              </div>
              <div className="dashboard-stat-content">
                <h3>{(summary?.totalReservations ?? 0).toLocaleString('vi-VN')}</h3>
                <p>Lượt đặt chỗ</p>
                <div className="dashboard-stat-sub">Đặt trước</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon duration">
                <ClockCircleOutlined />
              </div>
              <div className="dashboard-stat-content">
                <h3>{Math.round(summary?.avgParkingDurationMinutes ?? 0)} phút</h3>
                <p>Thời gian gửi xe TB</p>
                <div className="dashboard-stat-sub">Trung bình</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="dashboard-chart-section">
            <div className="dashboard-chart-card">
              <div className="dashboard-chart-header">
                <h2>Biểu đồ doanh thu & lưu lượng</h2>
                <span className="dashboard-chart-badge">
                  {timeRangeOptions.find((item) => item.value === timeRange)?.label}
                </span>
              </div>
              <div className="dashboard-chart-container">
                <ResponsiveContainer width="100%" height={360}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5b8def" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#5b8def" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                        return value.toString()
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '12px',
                      }}
                      labelStyle={{
                        color: '#111827',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                      itemStyle={{
                        color: '#374151',
                        fontSize: '14px',
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'Doanh thu') {
                          return [formatCurrency(value), name]
                        }
                        return [value.toLocaleString('vi-VN'), name]
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => (
                        <span style={{ color: '#374151', fontWeight: 500, fontSize: '13px' }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Doanh thu"
                      fill="url(#revenueGradient)"
                      radius={[8, 8, 0, 0]}
                      stroke="#5b8def"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="checkIns"
                      name="Lượt check-in"
                      stroke="#66d89c"
                      strokeWidth={4}
                      dot={{
                        fill: '#66d89c',
                        strokeWidth: 2,
                        stroke: '#fff',
                        r: 5,
                      }}
                      activeDot={{
                        r: 8,
                        fill: '#66d89c',
                        stroke: '#fff',
                        strokeWidth: 3,
                      }}
                      animationDuration={1000}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-insights-card">
              <h2>Chỉ số nổi bật</h2>
              <div className="dashboard-insights-list">
                <div className="dashboard-insight-item">
                  <div className="dashboard-insight-icon subscriptions">
                    <UserSwitchOutlined />
                  </div>
                  <div className="dashboard-insight-content">
                    <p>Lượt đăng ký mới</p>
                    <h3>{(summary?.newSubscriptions ?? 0).toLocaleString('vi-VN')}</h3>
                  </div>
                </div>
                <div className="dashboard-insight-item">
                  <div className="dashboard-insight-icon refunds">
                    <RiseOutlined />
                  </div>
                  <div className="dashboard-insight-content">
                    <p>Tổng hoàn tiền</p>
                    <h3>{formatCurrency(summary?.totalRefunded ?? 0)}</h3>
                  </div>
                </div>
                <div className="dashboard-insight-item">
                  <div className="dashboard-insight-icon checkouts">
                    <SwapOutlined />
                  </div>
                  <div className="dashboard-insight-content">
                    <p>Lượt check-out</p>
                    <h3>{(summary?.totalCheckOuts ?? 0).toLocaleString('vi-VN')}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Charts Section */}
          <div className="dashboard-pie-section">
            <div className="dashboard-pie-card">
              <h2>Cơ cấu doanh thu</h2>
              <div className="dashboard-pie-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      {revenuePieData.map((entry, index) => (
                        <linearGradient
                          key={entry.name}
                          id={`revenueGradient${index}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={revenuePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      dataKey="value"
                      nameKey="name"
                      paddingAngle={4}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {revenuePieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={`url(#revenueGradient${index})`}
                          stroke="#fff"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        `Tỷ lệ: ${getPercentage(value, totalRevenueBreakdown)}%`,
                      ]}
                      labelFormatter={(label) => `Kênh: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '12px',
                      }}
                      labelStyle={{
                        color: '#111827',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => {
                        const item = revenuePieData.find((d) => d.name === value)
                        return (
                          <span
                            style={{
                              color: '#374151',
                              fontWeight: 500,
                              fontSize: '13px',
                            }}
                          >
                            {value} ({getPercentage(item?.value || 0, totalRevenueBreakdown)}%)
                          </span>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dashboard-pie-card">
              <h2>Cơ cấu hoàn tiền</h2>
              <div className="dashboard-pie-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <defs>
                      {refundPieData.map((entry, index) => (
                        <linearGradient
                          key={entry.name}
                          id={`refundGradient${index}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={refundPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      dataKey="value"
                      nameKey="name"
                      paddingAngle={4}
                      animationBegin={200}
                      animationDuration={800}
                    >
                      {refundPieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={`url(#refundGradient${index})`}
                          stroke="#fff"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        `Tỷ lệ: ${getPercentage(value, totalRefundBreakdown)}%`,
                      ]}
                      labelFormatter={(label) => `Kênh: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        padding: '12px',
                      }}
                      labelStyle={{
                        color: '#111827',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => {
                        const item = refundPieData.find((d) => d.name === value)
                        return (
                          <span
                            style={{
                              color: '#374151',
                              fontWeight: 500,
                              fontSize: '13px',
                            }}
                          >
                            {value} ({getPercentage(item?.value || 0, totalRefundBreakdown)}%)
                          </span>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="dashboard-breakdown-section">
            <div className="dashboard-breakdown-card">
              <h2>Doanh thu theo kênh</h2>
              <div className="dashboard-breakdown-list">
                {[
                  {
                    label: 'Gửi lượt',
                    value: summary?.revenueBreakdown?.walkIn ?? 0,
                    color: '#5b8def',
                  },
                  {
                    label: 'Đặt chỗ',
                    value: summary?.revenueBreakdown?.reservation ?? 0,
                    color: '#9254de',
                  },
                  {
                    label: 'Gói tháng',
                    value: summary?.revenueBreakdown?.subscription ?? 0,
                    color: '#13c2c2',
                  },
                ].map((item) => (
                  <div key={item.label} className="dashboard-breakdown-item">
                    <div className="dashboard-breakdown-header">
                      <span
                        className="dashboard-breakdown-badge"
                        style={{ backgroundColor: item.color + '20', color: item.color }}
                      >
                        {item.label}
                      </span>
                      <span className="dashboard-breakdown-value">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                    <div className="dashboard-breakdown-progress">
                      <div
                        className="dashboard-breakdown-progress-bar"
                        style={{
                          width: `${getPercentage(item.value, totalRevenueBreakdown)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <div className="dashboard-breakdown-percentage">
                      {getPercentage(item.value, totalRevenueBreakdown)}%
                    </div>
                  </div>
                ))}
                <div className="dashboard-breakdown-total">
                  <span>Tổng cộng</span>
                  <strong>{formatCurrency(totalRevenueBreakdown)}</strong>
                </div>
              </div>
            </div>

            <div className="dashboard-breakdown-card">
              <h2>Hoàn tiền theo kênh</h2>
              <div className="dashboard-breakdown-list">
                {[
                  {
                    label: 'Gửi lượt',
                    value: summary?.refundBreakdown?.walkIn ?? 0,
                    color: '#fa8c16',
                  },
                  {
                    label: 'Đặt chỗ',
                    value: summary?.refundBreakdown?.reservation ?? 0,
                    color: '#eb2f96',
                  },
                  {
                    label: 'Gói tháng',
                    value: summary?.refundBreakdown?.subscription ?? 0,
                    color: '#faad14',
                  },
                ].map((item) => (
                  <div key={item.label} className="dashboard-breakdown-item">
                    <div className="dashboard-breakdown-header">
                      <span
                        className="dashboard-breakdown-badge"
                        style={{ backgroundColor: item.color + '20', color: item.color }}
                      >
                        {item.label}
                      </span>
                      <span className="dashboard-breakdown-value">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                    <div className="dashboard-breakdown-progress">
                      <div
                        className="dashboard-breakdown-progress-bar"
                        style={{
                          width: `${getPercentage(item.value, totalRefundBreakdown)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <div className="dashboard-breakdown-percentage">
                      {getPercentage(item.value, totalRefundBreakdown)}%
                    </div>
                  </div>
                ))}
                <div className="dashboard-breakdown-total">
                  <span>Tổng cộng</span>
                  <strong>{formatCurrency(totalRefundBreakdown)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardOperator
