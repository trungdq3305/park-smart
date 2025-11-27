// src/components/layout/AdminHeader/AdminHeader.tsx

import React from 'react'
import { Layout, Button, Dropdown, Avatar, Space, message } from 'antd'
import {
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  SendOutlined,
} from '@ant-design/icons'
import './AdminHeader.css'
import { getUserFullName } from '../../../utils/userData'
import { useLogout } from '../../../hooks/useLogout'
import { NotificationDropdown } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useSendTestNotificationMutation } from '../../../features/notification/notificationAPI'
const { Header } = Layout

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void
  isMobile?: boolean
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMobileMenuToggle, isMobile }) => {
  const fullName = getUserFullName('Quản trị viên')
  const logout = useLogout()
  const { userId, userRole } = useAuth()

  const [sendTestNotification, { isLoading: isSending }] = useSendTestNotificationMutation()

  // --- XỬ LÝ GỬI THÔNG BÁO MẪU ---
  const handleSendTestNotification = async () => {
    if (!userId || !userRole) {
      message.error('Không có thông tin người dùng (ID/Role) để gửi.')
      return
    }

    try {
      const payload = {
        recipientId: userId,
        recipientRole: userRole,
        type: 'ADMIN_SYSTEM_WIDE_ALERT',
        title: `THÔNG BÁO TỪ FE lúc ${new Date().toLocaleTimeString()}`,
        body: 'Thông báo kiểm thử. Nếu thấy real-time là đã kết nối WebSocket thành công!',
        data: {
          sentAt: new Date().toISOString(),
        },
      }
      await sendTestNotification(payload).unwrap()
    } catch (error) {
      message.error('Gửi thông báo test thất bại. Kiểm tra console và Backend log.')
      console.error('Error sending test notification:', error)
    }
  }

  const userMenuItems = [
    {
      key: '1',
      label: 'Hồ sơ cá nhân',
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: 'Cài đặt',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: '3',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        logout()
      },
    },
  ]

  return (
    <Header className="admin-header">
      {isMobile && (
        <button
          className="mobile-menu-toggle"
          onClick={onMobileMenuToggle}
          aria-label="Toggle mobile menu"
        >
          <MenuOutlined />
        </button>
      )}
      <div className="header-left">
        <h3>
          {isMobile
            ? `Xin chào, ${fullName.split(' ')[0]}!`
            : `Chào mừng quay lại, ${fullName}! Cùng quản lý hệ thống bãi đỗ nhé.`}
        </h3>
      </div>
      <div className="header-right">
        <Space size="middle">
          Gửi thông báo thử
          <Button
            type="text"
            className="header-action-btn notification-btn"
            onClick={handleSendTestNotification}
            aria-label="Send test notification"
            icon={<SendOutlined />}
            loading={isSending}
          />
          {/* NotificationDropdown */}
          <NotificationDropdown isMobile={!!isMobile} />
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <Button type="text" className="user-menu-btn">
              <Avatar
                size={isMobile ? 24 : 32}
                icon={<UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  marginRight: isMobile ? '6px' : '8px',
                }}
              />
              {!isMobile && fullName}
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  )
}

export default AdminHeader
