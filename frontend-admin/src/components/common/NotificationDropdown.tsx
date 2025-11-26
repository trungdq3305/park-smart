// src/components/common/NotificationDropdown/NotificationDropdown.tsx

import React, { useCallback, useState } from 'react'
import {
  Dropdown,
  Button,
  Badge,
  List,
  message,
  Spin,
  Space, // THÊM Spin, Space
} from 'antd'
import { BellOutlined, CheckCircleOutlined } from '@ant-design/icons' // THÊM CheckCircleOutlined
import { useAuth } from '../../hooks/useAuth'
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadSingleMutation,
} from '../../features/notification/notificationAPI'
import useNotificationSocket from '../../hooks/useNotificationSocket'

// Interface cho cấu trúc Notification
interface Notification {
  _id: string
  title: string
  body: string
  isRead: boolean // Dùng để highlight
  createdAt: string
}

interface NotificationDropdownProps {
  isMobile?: boolean
}

// Hàm format thời gian
const timeAgo = (dateString: string): string => {
  const now = new Date()
  const past = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} giây trước`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  return past.toLocaleDateString('vi-VN')
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isMobile = false }) => {
  const { userId } = useAuth() // Lấy số lượng chưa đọc & refetch

  const {
    data: unreadCount = 0,
    isFetching: isFetchingCount,
    refetch: refetchCount,
  } = useGetUnreadCountQuery(userId || '', {
    skip: !userId,
    // 🔥 SỬA: BỎ pollingInterval: 30000,
    // Bỏ hẳn pollingInterval để chỉ cập nhật khi có sự kiện (Socket hoặc Mutation)
  }) // Lấy danh sách thông báo & refetch

  const {
    data: responseData = { data: [] },
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useGetNotificationsQuery(userId || '', {
    skip: !userId,
  })
  const notifications: Notification[] = responseData.data || []
  const totalCount = notifications.length
 
  const [markAllAsRead, { isLoading: isMarkingRead }] = useMarkAllAsReadMutation()
  const [markAsReadSingle] = useMarkAsReadSingleMutation()
  const handleMarkAsReadSingle = async (notificationId: string, isCurrentlyRead: boolean) => {
    // Chỉ gọi API nếu thông báo CHƯA ĐỌC
    if (isCurrentlyRead) return

    try {
      // Không cần truyền userId, Backend lấy từ JWT Guard
      await markAsReadSingle(notificationId).unwrap()

      // Tùy chọn: Hiển thị thông báo thành công (Có thể bỏ qua nếu quá nhiều)
      // message.success('Đã đánh dấu thông báo là đã đọc!');

      // RTK Query sẽ tự động re-fetch danh sách và số đếm nhờ invalidatesTags.
    } catch (error) {
      console.error('Failed to mark single notification as read:', error)
      message.error('Đánh dấu đã đọc thất bại.')
    }
  }
  const [open, setOpen] = useState(false) // --- Xử lý sự kiện Thông báo mới từ WebSocket (GIỮ NGUYÊN) ---

  const handleNewNotification = useCallback(() => {
    void refetchCount()
    void refetchList()
  }, [refetchCount, refetchList]) // 🚀 Kết nối WebSocket

  useNotificationSocket({ onNewNotification: handleNewNotification, connectTrigger: !!userId }) // --- XỬ LÝ ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC (Hàm mới) ---

  const handleMarkAllAsReadClick = async () => {
    if (!userId || unreadCount === 0 || isMarkingRead) return
    try {
      const markedCount = await markAllAsRead(userId).unwrap()
      message.success(`Đã đánh dấu ${markedCount} thông báo là đã đọc!`)
      // Mutation đã tự động refetch qua invalidatesTags
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      message.error('Đánh dấu đã đọc thất bại.')
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    // 💡 QUAN TRỌNG: Không tự động gọi markAllAsRead ở đây
    setOpen(nextOpen)
  }

  // --- CẤU TRÚC DROPDOWN ---
  const items = notifications.slice(0, 5).map((n) => ({
    key: n._id,
    className: !n.isRead ? 'notification-item-unread' : '',
    label: (
      // Gán sự kiện onClick vào wrapper của item
      <div
        className="notification-item-click-wrapper"
        onClick={() => handleMarkAsReadSingle(n._id, n.isRead)}
        style={{ cursor: n.isRead ? 'default' : 'pointer' }} // Thay đổi con trỏ
      >
        <div className="notification-item-title-wrapper">
                              <div className="notification-item-title">{n.title}</div>             
                {!n.isRead && <span className="unread-dot" />}               {' '}
        </div>
                        <div className="notification-item-time">{timeAgo(n.createdAt)}</div>       
      </div>
    ),
  }))

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      placement="bottomRight"
      onOpenChange={handleOpenChange}
      open={open}
      popupRender={() => (
        <div
          style={{
            width: 350,
            padding: 8,
            backgroundColor: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ padding: '0 8px 8px', fontWeight: 'bold' }}>
                                Thông báo ({isFetchingCount ? '...' : unreadCount} chưa đọc)        
          </div>
          {isFetchingList ? (
            <div style={{ padding: '10px', textAlign: 'center' }}>
              <Spin /> Đang tải...
            </div>
          ) : totalCount > 0 ? (
            <List
              dataSource={items}
              renderItem={(item) => (
                <List.Item style={{ padding: '0 8px' }} className={item.className}>
                                                      {item.label}                             
                </List.Item>
              )}
            />
          ) : (
            <div style={{ padding: '10px', textAlign: 'center' }}>Không có thông báo nào.</div>
          )}
          <div style={{ borderTop: '1px solid #eee', padding: '8px 0 0' }}>
            <Space style={{ justifyContent: 'space-between', width: '100%', padding: '0 8px' }}>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkAllAsReadClick}
                disabled={unreadCount === 0 || isMarkingRead}
                loading={isMarkingRead}
              >
                                            Đọc tất cả                        {' '}
              </Button>
              <Button type="link" onClick={() => console.log('Go to notification page')}>
                Xem tất cả
              </Button>
            </Space>
          </div>
        </div>
      )}
    >
      <Button type="text" className="header-action-btn notification-btn" aria-label="Notifications">
        <Badge count={unreadCount} size="small" offset={[isMobile ? -2 : 0, 2]}>
                      <BellOutlined style={{ fontSize: isMobile ? 16 : 18 }} />         {' '}
        </Badge>
      </Button>
    </Dropdown>
  )
}

export default NotificationDropdown
