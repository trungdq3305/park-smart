import React, { useState, useMemo } from 'react'
import { useGetReportsQuery, useHandleReportMutation } from '../../../features/admin/reportAPI'
import { message, Button, Tag, Input } from 'antd'
import {
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { PaginationLoading } from '../../../components/common'
import type { Report } from '../../../types/Report'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import './ManageReport.css'

dayjs.extend(relativeTime)

const { TextArea } = Input

interface ListReportResponse {
  data: {
    data: Report[]
  }
  isLoading: boolean
}

const COLORS = {
  processed: '#10b981',
  pending: '#f59e0b',
  new: '#3b82f6',
}

const ManageReport: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'processed' | 'pending'>('all')
  const [responseText, setResponseText] = useState<string>('')

  const { data, isLoading } = useGetReportsQuery<ListReportResponse>({})
  const reports = data?.data || []
  const [handleReport, { isLoading: isHandlingReport }] = useHandleReportMutation()
  // Calculate statistics
  const stats = useMemo(() => {
    const total = reports.length
    const processed = reports.filter((r) => r.isProcessed).length
    const pending = reports.filter((r) => !r.isProcessed).length
    const thisMonth = reports.filter((r) => {
      const reportDate = dayjs(r.createdAt)
      return reportDate.month() === dayjs().month() && reportDate.year() === dayjs().year()
    }).length

    return { total, processed, pending, thisMonth }
  }, [reports])

  // Filter reports
  const filteredReports = useMemo(() => {
    if (filterStatus === 'all') return reports
    if (filterStatus === 'processed') return reports.filter((r) => r.isProcessed)
    return reports.filter((r) => !r.isProcessed)
  }, [reports, filterStatus])

  // Chart data for status distribution
  const statusChartData = useMemo(() => {
    return [
      { name: 'Đã xử lý', value: stats.processed, color: COLORS.processed },
      { name: 'Chờ xử lý', value: stats.pending, color: COLORS.pending },
    ]
  }, [stats])

  // Recent activity (last 10 reports)
  const recentActivity = useMemo(() => {
    return [...reports]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [reports])

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report)
    setResponseText(report.response || '')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedReport(null)
    setResponseText('')
  }

  const handleMarkAsProcessed = async () => {
    if (!selectedReport) return

    try {
      await handleReport({
        id: selectedReport._id,
        response: responseText,
      }).unwrap()

      message.success(
        `Báo cáo #${selectedReport._id.slice(0, 8)} đã được đánh dấu đã xử lý thành công!`
      )
      handleCloseModal()
    } catch (error :unknown) {
      const apiMsg =
        (error as { data?: { message: string }; error?: string })?.data?.message ||
        (error as { error?: string })?.error ||
        'Có lỗi xảy ra khi xử lý báo cáo!'
      message.error(apiMsg)
    }
  }

  const getStatusBadge = (isProcessed: boolean) => {
    return isProcessed ? 'badge-processed' : 'badge-pending'
  }

  const getCategoryColor = (categoryName: string) => {
    const colors: Record<string, string> = {
      default: 'red',
      urgent: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    }
    return colors[categoryName?.toLowerCase()] || colors.default
  }

  if (isLoading) {
    return (
      <div className="manage-report-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-report-page">
      <div className="page-header">
        <h1>Quản lý báo cáo</h1>
        <p>Quản lý và theo dõi tất cả báo cáo từ khách hàng</p>
      </div>

      <div className="page-content">
        {/* KPI Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon total-icon">
              <FileTextOutlined />
            </div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Tổng báo cáo</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon processed-icon">
              <CheckCircleOutlined />
            </div>
            <div className="stat-content">
              <h3>{stats.processed}</h3>
              <p>Đã xử lý</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending-icon">
              <ClockCircleOutlined />
            </div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Chờ xử lý</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon month-icon">
              <CalendarOutlined />
            </div>
            <div className="stat-content">
              <h3>{stats.thisMonth}</h3>
              <p>Tháng này</p>
            </div>
          </div>
        </div>

        {/* Charts and Activity Section */}
        <div className="charts-activity-section">
          {/* Left: Charts */}
          <div className="charts-section">
            {/* Status Distribution Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Phân bố trạng thái</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props
                        return `${name}: ${((percent as number) * 100).toFixed(0)}%`
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {statusChartData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>


          </div>

          {/* Right: Activity Feed */}
          <div className="activity-card">
            <div className="activity-header">
              <h3>Hoạt động gần đây</h3>
            </div>
            <div className="activity-list">
              {recentActivity.length === 0 ? (
                <div className="no-activity">Không có hoạt động nào</div>
              ) : (
                recentActivity.map((report) => (
                  <div key={report._id} className="activity-item">
                    <div
                      className="activity-dot"
                      style={{
                        backgroundColor: report.isProcessed ? COLORS.processed : COLORS.pending,
                      }}
                    ></div>
                    <div className="activity-content">
                      <p>
                        <strong>Báo cáo #{report._id}</strong> - {report.category?.name || 'Không có danh mục'}
                      </p>
                      <span className="activity-time">
                        {dayjs(report.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="table-container">
          <div className="table-header">
            <h3>Danh sách báo cáo</h3>
            <div className="table-controls">
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  Tất cả
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'processed' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('processed')}
                >
                  Đã xử lý
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('pending')}
                >
                  Chờ xử lý
                </button>
              </div>
              <span className="table-count">{filteredReports.length} báo cáo</span>
            </div>
          </div>

          <div className="table-wrapper">
            <PaginationLoading isLoading={false} loadingText="Đang tải...">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th>Người báo cáo</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="no-data">
                        Không có báo cáo nào
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report._id}>
                        <td>
                          <Tag color={getCategoryColor(report.category?.name || 'default')}>
                            {report.category?.name || 'Không có'}
                          </Tag>
                        </td>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {report.driverId?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span> {report.operatorInfo?.name.slice(0, 8) || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="date-text">
                            {dayjs(report.createdAt).format('DD/MM/YYYY HH:mm')}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadge(report.isProcessed)}`}>
                            {report.isProcessed ? 'Đã xử lý' : 'Chờ xử lý'}
                          </span>
                        </td>
                        <td>
                          <div className="action-cell">
                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              className="action-btn"
                              title="Xem chi tiết"
                              onClick={() => handleViewDetails(report)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </PaginationLoading>
          </div>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết báo cáo #{selectedReport._id.slice(0, 8)}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Thông tin cơ bản</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Danh mục:</span>
                    <Tag color={getCategoryColor(selectedReport.category?.name || 'default')}>
                      {selectedReport.category?.name || 'Không có'}
                    </Tag>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Trạng thái:</span>
                    <span className={`status-badge ${getStatusBadge(selectedReport.isProcessed)}`}>
                      {selectedReport.isProcessed ? 'Đã xử lý' : 'Chờ xử lý'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày tạo:</span>
                    <span>{dayjs(selectedReport.createdAt).format('DD/MM/YYYY HH:mm:ss')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cập nhật lần cuối:</span>
                    <span>{dayjs(selectedReport.updatedAt).format('DD/MM/YYYY HH:mm:ss')}</span>
                  </div>
                </div>
              </div>
              <div className="detail-section">
                <h4>Lý do báo cáo</h4>
                <div className="reason-box">{selectedReport.reason || 'Không có lý do'}</div>
              </div>
              {selectedReport.response && selectedReport.isProcessed && (
                <div className="detail-section">
                  <h4>Phản hồi</h4>
                  <div className="response-box">{selectedReport.response}</div>
                </div>
              )}
              {!selectedReport.isProcessed && (
                <div className="detail-section">
                  <h4>Phản hồi</h4>
                  <TextArea
                    rows={4}
                    placeholder="Nhập phản hồi cho báo cáo này..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="response-input"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <Button onClick={handleCloseModal}>Đóng</Button>
              {!selectedReport.isProcessed && (
                <Button
                  type="primary"
                  onClick={handleMarkAsProcessed}
                  loading={isHandlingReport}
                  disabled={!responseText.trim()}
                >
                  Đánh dấu đã xử lý
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageReport
