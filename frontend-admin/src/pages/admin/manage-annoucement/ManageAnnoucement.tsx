import React, { useMemo, useState } from 'react'
import { message } from 'antd'
import { PlusOutlined, BellOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons'
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useCreateAnnouncementNowMutation,
} from '../../../features/admin/announcementAPI'
import type { Announcement } from '../../../types/Announcement'
import CreateAnnouncementModal from '../../../components/announcements/CreateAnnouncementModal'
import './ManageAnnoucement.css'

interface AnnouncementsResponse {
  data: Announcement[]
}

type AnnouncementFilter = 'all' | 'ADMIN' | 'OPERATOR' | 'DRIVER'

const getRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    ADMIN: 'Admin',
    OPERATOR: 'Operator',
    DRIVER: 'Tài xế',
  }
  return roleMap[role] || role
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${day}/${month}/${year}, ${hours}:${minutes}`
}

const ManageAnnoucement: React.FC = () => {
  const [filter, setFilter] = useState<AnnouncementFilter>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data, isLoading, error } = useGetAnnouncementsQuery({}) as {
    data?: AnnouncementsResponse
    isLoading: boolean
    error?: unknown
  }
  const [createAnnouncement, { isLoading: isCreatingSchedule }] = useCreateAnnouncementMutation()
  const [createAnnouncementNow, { isLoading: isCreatingNow }] = useCreateAnnouncementNowMutation()

  const isCreating = isCreatingSchedule || isCreatingNow

  const announcements: Announcement[] = Array.isArray(data)
    ? data
    : (data as { data?: Announcement[] })?.data || []

  const stats = useMemo(() => {
    const total = announcements.length
    let admin = 0
    let operator = 0
    let driver = 0

    announcements.forEach((announcement) => {
      if (announcement.recipientRoles.includes('ADMIN')) admin += 1
      if (announcement.recipientRoles.includes('OPERATOR')) operator += 1
      if (announcement.recipientRoles.includes('DRIVER')) driver += 1
    })

    return { total, admin, operator, driver }
  }, [announcements])

  const filteredAnnouncements = useMemo(() => {
    let filtered =
      filter === 'all'
        ? announcements
        : announcements.filter((announcement) => announcement.recipientRoles.includes(filter))
    // Reverse để hiển thị mới nhất trước
    return [...filtered].reverse()
  }, [announcements, filter])

  const handleCreateAnnouncement = async (announcementData: any) => {
    try {
      const { sendType, ...data } = announcementData

      if (sendType === 'now') {
        await createAnnouncementNow(data).unwrap()
        message.success('Gửi thông báo thành công')
      } else {
        await createAnnouncement(data).unwrap()
        message.success('Lên lịch thông báo thành công')
      }

      setIsCreateModalOpen(false)
    } catch (error: any) {
      message.error(
        error?.data?.message ||
          (announcementData.sendType === 'now'
            ? 'Gửi thông báo thất bại'
            : 'Lên lịch thông báo thất bại')
      )
    }
  }

  if (isLoading) {
    return (
      <div className="manage-announcement-page">
        <div className="announcement-loading">
          <div className="announcement-loading-spinner" />
          <p>Đang tải danh sách thông báo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-announcement-page">
        <div className="announcement-error">
          <span className="announcement-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách thông báo. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-announcement-page">
      <div className="announcement-page-header">
        <div className="announcement-header-content">
          <div>
            <h1>Quản lý thông báo</h1>
            <p>Xem và quản lý tất cả thông báo trong hệ thống Park Smart</p>
          </div>
          <button className="announcement-create-btn" onClick={() => setIsCreateModalOpen(true)}>
            <PlusOutlined />
            <span>Tạo thông báo mới</span>
          </button>
        </div>
      </div>

      <div className="announcement-page-content">
        {/* Stats */}
        <div className="announcement-stats-section">
          <div className="announcement-stat-card">
            <div className="announcement-stat-icon total">📢</div>
            <div className="announcement-stat-content">
              <h3>{stats.total}</h3>
              <p>Tổng thông báo</p>
              <div className="announcement-stat-sub">Tất cả thông báo</div>
            </div>
          </div>
          <div className="announcement-stat-card">
            <div className="announcement-stat-icon admin">👤</div>
            <div className="announcement-stat-content">
              <h3>{stats.admin}</h3>
              <p>Cho Admin</p>
              <div className="announcement-stat-sub">Thông báo cho Admin</div>
            </div>
          </div>
          <div className="announcement-stat-card">
            <div className="announcement-stat-icon operator">🏢</div>
            <div className="announcement-stat-content">
              <h3>{stats.operator}</h3>
              <p>Cho Operator</p>
              <div className="announcement-stat-sub">Thông báo cho Operator</div>
            </div>
          </div>
          <div className="announcement-stat-card">
            <div className="announcement-stat-icon driver">🚗</div>
            <div className="announcement-stat-content">
              <h3>{stats.driver}</h3>
              <p>Cho Tài xế</p>
              <div className="announcement-stat-sub">Thông báo cho Tài xế</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="announcement-controls-card">
          <div className="announcement-filter-wrapper">
            <label htmlFor="role-filter" className="announcement-filter-label">
              Lọc theo đối tượng:
            </label>
            <select
              id="role-filter"
              className="announcement-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as AnnouncementFilter)}
            >
              <option value="all">-- Tất cả --</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="DRIVER">Tài xế</option>
            </select>
          </div>
          <div className="announcement-counter">
            Đang hiển thị <strong>{filteredAnnouncements.length}</strong> / {stats.total} thông báo
          </div>
        </div>

        {/* Announcement List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="announcement-empty-state">
            <div className="announcement-empty-icon">📢</div>
            <h3 className="announcement-empty-title">Chưa có thông báo nào</h3>
            <p className="announcement-empty-text">
              {filter === 'all'
                ? 'Chưa có thông báo nào trong hệ thống.'
                : `Không có thông báo cho "${getRoleLabel(filter)}".`}
            </p>
          </div>
        ) : (
          <div className="announcement-list">
            {filteredAnnouncements.map((announcement) => {
              const scheduleDate = announcement.scheduleAt
                ? formatDateTime(announcement.scheduleAt)
                : 'Chưa lên lịch'

              return (
                <div key={announcement._id} className="announcement-item">
                  <div className="announcement-item-header">
                    <div className="announcement-item-title-section">
                      <h3 className="announcement-item-title">{announcement.title}</h3>
                      <div className="announcement-type-badge announcement-type-policy">
                        <BellOutlined />
                        <span>Cập nhật chính sách</span>
                      </div>
                    </div>
                    <div className="announcement-item-meta">
                      <div className="announcement-meta-item">
                        <CalendarOutlined />
                        <span>{scheduleDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="announcement-item-body">
                    <div className="announcement-content">
                      <p>{announcement.content}</p>
                    </div>
                    <div className="announcement-recipients">
                      <div className="announcement-recipients-label">
                        <UserOutlined />
                        <span>Gửi đến:</span>
                      </div>
                      <div className="announcement-recipients-tags">
                        {announcement.recipientRoles.map((role) => (
                          <span key={role} className="announcement-recipient-tag">
                            {getRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateAnnouncementModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAnnouncement}
        loading={isCreating}
      />
    </div>
  )
}

export default ManageAnnoucement
