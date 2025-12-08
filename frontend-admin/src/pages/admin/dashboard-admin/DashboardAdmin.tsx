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
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts'

const DashboardAdmin: React.FC = () => {
  const { data, isLoading, error } = useGetDashboardAdminQuery({})
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(29, 'day').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'))

  const {
    data: newRegRes,
    isLoading: isLoadingNewReg,
    error: newRegError,
  } = useGetDashboardNewRegistrationQuery({
    startDate,
    endDate,
  })

  const stats = data?.data || {}
  const newRegData = newRegRes?.data || {}

  const newRegRoleChartData = useMemo(() => {
    const counts = newRegData.countsByRole || {}
    const entries = [
      { role: 'Operator', value: counts.Operator ?? 0, color: '#0ea5e9' },
      { role: 'Driver', value: counts.Driver ?? 0, color: '#22c55e' },
      { role: 'Admin', value: counts.Admin ?? 0, color: '#a855f7' },
      { role: 'Unknown', value: counts.Unknown ?? 0, color: '#94a3b8' },
    ]
    return entries.filter((e) => e.value > 0)
  }, [newRegData])

  const handleQuickRange = (days: number) => {
    const end = dayjs()
    const start = end.subtract(days - 1, 'day')
    setStartDate(start.format('YYYY-MM-DD'))
    setEndDate(end.format('YYYY-MM-DD'))
  }

  const roleDistribution = useMemo(() => {
    const drivers = stats.totalDrivers ?? 0
    const operators = stats.totalOperators ?? 0
    const admins = stats.totalAdmins ?? 0
    const known = drivers + operators + admins
    const others = Math.max((stats.totalUsers ?? 0) - known, 0)
    return [
      { name: 'Drivers', value: drivers, color: '#22c55e' },
      { name: 'Operators', value: operators, color: '#0ea5e9' },
      { name: 'Admins', value: admins, color: '#a855f7' },
      ...(others > 0 ? [{ name: 'Khác', value: others, color: '#94a3b8' }] : []),
    ].filter((item) => item.value > 0)
  }, [stats])

  const activeRate = useMemo(() => {
    const active = stats.totalActiveUsers ?? 0
    const total = stats.totalUsers ?? 0
    if (!total) return 0
    return Math.min(Math.max((active / total) * 100, 0), 100)
  }, [stats])

  const totalNewRegistrations = stats.newRegistrationsLast7Days ?? 0

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
          <p>Tổng quan người dùng & đăng ký</p>
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
            <h3>Đăng ký mới theo vai trò</h3>
            <p>
              Khoảng: {startDate} - {endDate}
            </p>
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
          <div className="admin-pill success" style={{ minWidth: 0 }}>
            <span>Tổng đăng ký mới</span>
            <strong>{newRegData.totalNewAccounts ?? 0}</strong>
          </div>
        </div>

        <div className="admin-chart-body">
          {newRegError ? (
            <div className="admin-empty-chart">Không tải được dữ liệu đăng ký mới</div>
          ) : isLoadingNewReg ? (
            <div className="admin-empty-chart">Đang tải dữ liệu...</div>
          ) : newRegRoleChartData.length === 0 ? (
            <div className="admin-empty-chart">Chưa có dữ liệu đăng ký mới</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={newRegRoleChartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <YAxis dataKey="role" type="category" tick={{ fontSize: 13, fill: '#0f172a', fontWeight: 700 }} />
                <RechartsTooltip
                  formatter={(val: any) => [`${val}`, 'Số đăng ký']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {newRegRoleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>Phân bổ vai trò</h3>
              <p>Tỷ trọng người dùng theo role</p>
            </div>
          </div>
          <div className="admin-chart-body pie-body">
            {roleDistribution.length === 0 ? (
              <div className="admin-empty-chart">Chưa có dữ liệu vai trò</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [`${val}`, name]}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="admin-legend">
              {roleDistribution.map((item) => (
                <div className="admin-legend-item" key={item.name}>
                  <span style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>Trạng thái tài khoản</h3>
              <p>Active / Inactive / Banned</p>
            </div>
          </div>
          <div className="admin-chart-body">
            <div className="admin-status-grid">
              <div className="admin-pill success">
                <span>Active</span>
                <strong>{stats.totalActiveUsers ?? 0}</strong>
              </div>
              <div className="admin-pill info">
                <span>Inactive</span>
                <strong>{stats.totalInactiveUsers ?? 0}</strong>
              </div>
              <div className="admin-pill danger">
                <span>Banned</span>
                <strong>{stats.totalBannedUsers ?? 0}</strong>
              </div>
            </div>
            <div className="admin-radial-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart
                  innerRadius="65%"
                  outerRadius="110%"
                  data={[
                    { name: 'Active rate', value: activeRate, fill: '#22c55e' },
                    { name: 'Inactive rate', value: 100 - activeRate, fill: '#e5e7eb' },
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" />
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [`${Math.round(val)}%`, name]}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="admin-radial-center">
                <div className="admin-radial-value">{Math.round(activeRate)}%</div>
                <div className="admin-radial-label">Tài khoản đang hoạt động</div>
                <div className="admin-radial-sub">
                  {stats.totalActiveUsers ?? 0}/{stats.totalUsers ?? 0} users
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-highlight-cards">
        <div className="admin-highlight">
          <div className="admin-highlight-title">Đăng ký mới 7 ngày</div>
          <div className="admin-highlight-value">{totalNewRegistrations}</div>
          <div className="admin-highlight-desc">Tổng số đăng ký gần nhất</div>
        </div>
        <div className="admin-highlight">
          <div className="admin-highlight-title">Tổng người dùng</div>
          <div className="admin-highlight-value">{stats.totalUsers ?? 0}</div>
          <div className="admin-highlight-desc">Bao gồm tất cả vai trò</div>
        </div>
        <div className="admin-highlight">
          <div className="admin-highlight-title">Bị khóa</div>
          <div className="admin-highlight-value danger-text">{stats.totalBannedUsers ?? 0}</div>
          <div className="admin-highlight-desc">Tài khoản cần xem xét</div>
        </div>
      </div>
    </div>
  )
}

export default DashboardAdmin