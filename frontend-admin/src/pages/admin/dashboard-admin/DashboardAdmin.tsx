import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useGetDashboardAdminQuery, useGetDashboardNewRegistrationQuery } from '../../../features/admin/dashboardAdminAPI'
import './DashboardAdmin.css'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Line,
} from 'recharts'

const DashboardAdmin: React.FC = () => {
  const { data, isLoading, error } = useGetDashboardAdminQuery({})
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(13, 'day').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'))

  const {
    data: newRegData,
    isLoading: isLoadingNewReg,
    error: newRegError,
  } = useGetDashboardNewRegistrationQuery({
    startDate,
    endDate,
  })

  const stats = data?.data || {}

  const chartData = useMemo(() => {
    const registrations = stats.registrationsByDateLast7Days || {}
    const entries = Object.entries(registrations).map(([date, value]) => ({
      date,
      registrations: value as number,
    }))
    // sort by date ascending
    entries.sort((a, b) => a.date.localeCompare(b.date))
    return entries
  }, [stats])

  const newRegChartData = useMemo(() => {
    const payload = newRegData?.data ?? newRegData ?? []
    let rows: any[] = []
    if (Array.isArray(payload)) {
      rows = payload
    } else if (payload?.items && Array.isArray(payload.items)) {
      rows = payload.items
    } else if (payload?.registrationsByDate) {
      rows = Object.entries(payload.registrationsByDate).map(([date, value]: any) => ({
        date,
        ...(value || {}),
      }))
    }

    const normalized = rows
      .map((item) => {
        const drivers = item.drivers ?? item.driver ?? item.driversCount ?? 0
        const operators = item.operators ?? item.operator ?? item.operatorsCount ?? 0
        const admins = item.admins ?? item.admin ?? item.adminsCount ?? 0
        const total =
          item.total ??
          item.count ??
          item.value ??
          item.registrations ??
          item.registration ??
          drivers +
            operators +
            admins +
            (item.others ?? item.other ?? 0)

        return {
          date: item.date,
          drivers,
          operators,
          admins,
          total,
        }
      })
      .filter((row) => row.date)

    normalized.sort((a, b) => a.date.localeCompare(b.date))
    return normalized
  }, [newRegData])

  const totalNewRegistrations = useMemo(
    () => newRegChartData.reduce((sum, row) => sum + (row.total || 0), 0),
    [newRegChartData]
  )

  const peakDay = useMemo(() => {
    if (!newRegChartData.length) return null
    return newRegChartData.reduce((best, current) => (current.total > best.total ? current : best), newRegChartData[0])
  }, [newRegChartData])

  const handleQuickRange = (days: number) => {
    const end = dayjs()
    const start = end.subtract(days - 1, 'day')
    setStartDate(start.format('YYYY-MM-DD'))
    setEndDate(end.format('YYYY-MM-DD'))
  }

  const StatCard = ({
    title,
    value,
    accent,
    subtext,
  }: {
    title: string
    value: number | string
    accent: string
    subtext?: string
  }) => (
    <div className="admin-stat-card">
      <div className="admin-stat-icon" style={{ background: accent }} />
      <div className="admin-stat-content">
        <div className="admin-stat-title">{title}</div>
        <div className="admin-stat-value">{value ?? 0}</div>
        {subtext && <div className="admin-stat-sub">{subtext}</div>}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="dashboard-admin-page">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p>Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-admin-page">
        <div className="admin-error">
          <span className="admin-error-badge">Lỗi</span>
          <p>Không thể tải dữ liệu dashboard. Vui lòng thử lại.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-admin-page">
      <div className="admin-header">
        <div>
          <h1>Dashboard Admin</h1>
          <p>Tổng quan người dùng & đăng ký trong 7 ngày</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <StatCard title="Tổng người dùng" value={stats.totalUsers} accent="linear-gradient(135deg,#4f46e5,#6366f1)" />
        <StatCard title="Drivers" value={stats.totalDrivers} accent="linear-gradient(135deg,#10b981,#34d399)" />
        <StatCard title="Operators" value={stats.totalOperators} accent="linear-gradient(135deg,#0ea5e9,#38bdf8)" />
        <StatCard title="Admins" value={stats.totalAdmins} accent="linear-gradient(135deg,#a855f7,#c084fc)" />
        <StatCard title="Đang hoạt động" value={stats.totalActiveUsers} accent="linear-gradient(135deg,#22c55e,#16a34a)" subtext="Active accounts" />
        <StatCard title="Không hoạt động" value={stats.totalInactiveUsers} accent="linear-gradient(135deg,#f97316,#fb923c)" subtext="Inactive accounts" />
        <StatCard title="Bị khóa" value={stats.totalBannedUsers} accent="linear-gradient(135deg,#ef4444,#f87171)" subtext="Banned users" />
        <StatCard title="Đăng ký mới (7 ngày)" value={stats.newRegistrationsLast7Days} accent="linear-gradient(135deg,#06b6d4,#22d3ee)" subtext="Trong 7 ngày gần nhất" />
      </div>

      <div className="admin-chart-card">
        <div className="admin-chart-header">
          <div>
            <h3>Đăng ký theo ngày (7 ngày)</h3>
            <p>Biểu đồ số đăng ký người dùng</p>
          </div>
        </div>
        <div className="admin-chart-body">
          {chartData.length === 0 ? (
            <div className="admin-empty-chart">Chưa có dữ liệu đăng ký</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }}
                  labelStyle={{ color: '#111827', fontWeight: 700 }}
                />
                <Legend />
                <Bar dataKey="registrations" fill="url(#regGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h3>Đăng ký mới theo khoảng thời gian</h3>
            <p>Tùy chọn khoảng ngày để xem phân bố đăng ký mới</p>
          </div>
          <div className="admin-range-actions">
            <button className="admin-chip" onClick={() => handleQuickRange(7)}>
              7 ngày
            </button>
            <button className="admin-chip" onClick={() => handleQuickRange(14)}>
              14 ngày
            </button>
            <button className="admin-chip" onClick={() => handleQuickRange(30)}>
              30 ngày
            </button>
          </div>
        </div>

        <div className="admin-range-filters">
          <div className="admin-input-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="admin-input-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={dayjs().format('YYYY-MM-DD')}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="admin-range-badges">
            <div className="admin-pill success">
              <span>Tổng đăng ký</span>
              <strong>{totalNewRegistrations}</strong>
            </div>
            <div className="admin-pill info">
              <span>Ngày cao nhất</span>
              <strong>{peakDay ? `${peakDay.date} (${peakDay.total})` : '-'}</strong>
            </div>
          </div>
        </div>

        <div className="admin-chart-card compact">
          <div className="admin-chart-header">
            <div>
              <h4>Phân bố đăng ký mới</h4>
              <p>Stacked chart Drivers / Operators / Admins</p>
            </div>
            {isLoadingNewReg && <span className="admin-badge subtle">Đang tải...</span>}
            {newRegError && <span className="admin-badge danger">Lỗi tải dữ liệu</span>}
          </div>
          <div className="admin-chart-body">
            {newRegChartData.length === 0 && !isLoadingNewReg ? (
              <div className="admin-empty-chart">Chưa có dữ liệu đăng ký cho khoảng này</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={newRegChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }}
                    labelStyle={{ color: '#111827', fontWeight: 700 }}
                  />
                  <Legend />
                  <Bar dataKey="drivers" stackId="reg" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="operators" stackId="reg" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="admins" stackId="reg" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="total" stroke="#111827" strokeWidth={2.2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin