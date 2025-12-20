import React, { useState, useMemo } from 'react'
import { message } from 'antd'
import {
  FileTextOutlined,
  SendOutlined,
  ReloadOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useGetReportCategoriesQuery } from '../../../features/admin/reportCategoryAPI'
import { useCreateReportMutation, useGetMyReportsQuery } from '../../../features/admin/reportAPI'
import type { ReportCategory } from '../../../types/ReportCategory'
import type { Report } from '../../../types/Report'
import CustomModal from '../../../components/common/CustomModal'
import dayjs from 'dayjs'
import './CreateReport.css'
import { getParkingLotId } from '../../../utils/parkingLotId'

interface ReportCategoryResponse {
  data: {
    data: ReportCategory[]
  }
  isLoading: boolean
}
interface MyReportsResponse {
  data: {
    data: Report[]
  }
  isLoading: boolean
}

const CreateReport: React.FC = () => {
  const parkingLotId = getParkingLotId()
  const [formData, setFormData] = useState({
    categoryId: '',
    reason: '',
  })
  const [errors, setErrors] = useState<{
    categoryId?: string
    reason?: string
  }>({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'processed' | 'pending'>('all')

  const { data: reportCategoriesData, isLoading: isLoadingReportCategories } =
    useGetReportCategoriesQuery<ReportCategoryResponse>({})
  const reportCategories = reportCategoriesData?.data || []
  const [createReport, { isLoading }] = useCreateReportMutation()
  const {
    data: myReportsData,
    isLoading: isLoadingMyReports,
    refetch,
  } = useGetMyReportsQuery<MyReportsResponse>({})

  const allReports = (myReportsData as unknown as { data: Report[] })?.data || []

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = allReports

    // Filter by status
    if (statusFilter === 'processed') {
      filtered = filtered.filter((r) => r.isProcessed)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((r) => !r.isProcessed)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.reason.toLowerCase().includes(query) ||
          r.category?.name.toLowerCase().includes(query) ||
          (r.parkingLotId && r.parkingLotId.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [allReports, statusFilter, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const total = allReports.length
    const processed = allReports.filter((r) => r.isProcessed).length
    const pending = allReports.filter((r) => !r.isProcessed).length
    return { total, processed, pending }
  }, [allReports])

  const showModal = () => {
    setIsModalVisible(true)
    refetch()
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setSearchQuery('')
    setStatusFilter('all')
  }

  const validateForm = () => {
    const newErrors: { categoryId?: string; reason?: string } = {}

    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn loại báo cáo'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Vui lòng nhập nội dung báo cáo'
    } else if (formData.reason.length > 2000) {
      newErrors.reason = 'Nội dung báo cáo không được vượt quá 2000 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const payload = {
        parkingLotId: parkingLotId || null,
        categoryId: formData.categoryId,
        reason: formData.reason,
      }

      await createReport(payload).unwrap()
      message.success(
        'Báo cáo đã được gửi thành công! Quản trị viên sẽ xem xét và phản hồi sớm nhất.'
      )
      setFormData({
        categoryId: '',
        reason: '',
      })
      setErrors({})
      refetch()
    } catch (err: unknown) {
      const extractMessage = (e: unknown): string => {
        if (typeof e === 'object' && e !== null) {
          const withData = e as { data?: unknown; message?: unknown }
          if (withData.data && typeof (withData.data as any).message === 'string') {
            return (withData.data as any).message as string
          }
          if (typeof withData.message === 'string') return withData.message
        }
        if (e instanceof Error) return e.message
        if (typeof e === 'string') return e
        return 'Gửi báo cáo thất bại'
      }

      message.error(extractMessage(err))
    }
  }

  const handleReset = () => {
    setFormData({
      categoryId: '',
      reason: '',
    })
    setErrors({})
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm')
  }

  return (
    <div className="report-management-page">
      <div className="report-page-header">
        <div>
          <h1>Quản lý báo cáo</h1>
          <p>Gửi báo cáo và theo dõi trạng thái xử lý từ quản trị viên</p>
        </div>
        <button className="report-view-history-btn" onClick={showModal}>
          <HistoryOutlined />
          <span>Lịch sử báo cáo</span>
        </button>
      </div>

      <div className="report-page-content">
        {/* Stats Section */}
        <div className="report-stats-section">
          <div className="report-stat-card">
            <div className="report-stat-icon total">
              <FileTextOutlined />
            </div>
            <div className="report-stat-content">
              <h3>{stats.total}</h3>
              <p>Tổng báo cáo</p>
              <div className="report-stat-sub">Tất cả báo cáo</div>
            </div>
          </div>
          <div className="report-stat-card">
            <div className="report-stat-icon processed">
              <CheckCircleOutlined />
            </div>
            <div className="report-stat-content">
              <h3>{stats.processed}</h3>
              <p>Đã xử lý</p>
              <div className="report-stat-sub">Đã có phản hồi</div>
            </div>
          </div>
          <div className="report-stat-card">
            <div className="report-stat-icon pending">
              <ClockCircleOutlined />
            </div>
            <div className="report-stat-content">
              <h3>{stats.pending}</h3>
              <p>Đang chờ</p>
              <div className="report-stat-sub">Chờ xử lý</div>
            </div>
          </div>
        </div>

        {/* Create Report Form */}
        <div className="report-create-card">
          <div className="report-create-header">
            <div className="report-create-header-icon">
              <PlusOutlined />
            </div>
            <div>
              <h2>Tạo báo cáo mới</h2>
              <p>Gửi báo cáo chi tiết về vấn đề, đề xuất hoặc phản hồi</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="report-form">
            <div className="report-form-group">
              <label className="report-form-label">
                Loại báo cáo <span className="required">*</span>
              </label>
              <div className="report-select-wrapper">
                <select
                  className={`report-select ${errors.categoryId ? 'error' : ''}`}
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  disabled={isLoadingReportCategories}
                >
                  <option value="">-- Chọn loại báo cáo --</option>
                  {reportCategories.map((category: ReportCategory) => (
                    <option key={category._id} value={category._id} title={category.description}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {isLoadingReportCategories && (
                  <div className="report-select-loading">Đang tải...</div>
                )}
              </div>
              {errors.categoryId && (
                <div className="report-form-error">
                  <ExclamationCircleOutlined />
                  <span>{errors.categoryId}</span>
                </div>
              )}
            </div>

            <div className="report-form-group">
              <label className="report-form-label">
                Nội dung báo cáo <span className="required">*</span>
              </label>
              <div className="report-textarea-wrapper">
                <textarea
                  className={`report-textarea ${errors.reason ? 'error' : ''}`}
                  rows={8}
                  placeholder="Nhập nội dung báo cáo chi tiết tại đây..."
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  maxLength={2000}
                />
                <div className="report-textarea-footer">
                  <span className="report-char-count">{formData.reason.length} / 2000 ký tự</span>
                </div>
              </div>
              {errors.reason && (
                <div className="report-form-error">
                  <ExclamationCircleOutlined />
                  <span>{errors.reason}</span>
                </div>
              )}
              <div className="report-form-help">
                Vui lòng mô tả chi tiết vấn đề, đề xuất hoặc phản hồi của bạn (tối thiểu 20 ký tự)
              </div>
            </div>

            <div className="report-form-actions">
              <button type="button" className="report-reset-btn" onClick={handleReset}>
                <ReloadOutlined />
                <span>Làm mới</span>
              </button>
              <button type="submit" className="report-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="report-loading-spinner" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <SendOutlined />
                    <span>Gửi báo cáo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reports History Modal */}
      <CustomModal
        open={isModalVisible}
        onClose={handleCancel}
        title="Lịch sử báo cáo"
        width="1000px"
      >
        <div className="report-modal-content">
          {/* Filters */}
          <div className="report-modal-filters">
            <div className="report-search-wrapper">
              <SearchOutlined className="report-search-icon" />
              <input
                type="text"
                className="report-search-input"
                placeholder="Tìm kiếm báo cáo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="report-filter-buttons">
              <button
                className={`report-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Tất cả ({stats.total})
              </button>
              <button
                className={`report-filter-btn ${statusFilter === 'processed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('processed')}
              >
                Đã xử lý ({stats.processed})
              </button>
              <button
                className={`report-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Đang chờ ({stats.pending})
              </button>
            </div>
          </div>

          {/* Reports List */}
          {isLoadingMyReports ? (
            <div className="report-loading">
              <div className="report-loading-spinner" />
              <p>Đang tải...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="report-empty-state">
              <div className="report-empty-icon">📋</div>
              <h3>Không tìm thấy báo cáo</h3>
              <p>
                {searchQuery || statusFilter !== 'all'
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Bạn chưa gửi báo cáo nào'}
              </p>
            </div>
          ) : (
            <div className="report-list">
              {filteredReports.map((report: Report) => (
                <div
                  key={report._id}
                  className={`report-item-card ${report.isProcessed ? 'processed' : 'pending'}`}
                >
                  <div className="report-item-header">
                    <div className="report-item-title-section">
                      <div className="report-category-badge">
                        {report.category?.name || 'Không có loại'}
                      </div>
                      <div
                        className={`report-status-badge ${report.isProcessed ? 'processed' : 'pending'}`}
                      >
                        {report.isProcessed ? (
                          <>
                            <CheckCircleOutlined />
                            <span>Đã xử lý</span>
                          </>
                        ) : (
                          <>
                            <ClockCircleOutlined />
                            <span>Đang chờ</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="report-item-date">{formatDate(report.createdAt)}</div>
                  </div>

                  <div className="report-item-body">
                    <div className="report-item-content">
                      <p>{report.reason}</p>
                    </div>

                    {report.parkingLotId && (
                      <div className="report-item-meta">
                        <span className="report-meta-label">ID Bãi đỗ xe:</span>
                        <span className="report-meta-value">{report.parkingLotId}</span>
                      </div>
                    )}

                    {report.isProcessed && report.response && (
                      <div className="report-item-response">
                        <div className="report-response-header">
                          <CheckCircleOutlined />
                          <span>Phản hồi từ Admin</span>
                        </div>
                        <p>{report.response}</p>
                        <div className="report-response-date">
                          Xử lý lúc: {formatDate(report.updatedAt)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CustomModal>
    </div>
  )
}

export default CreateReport
