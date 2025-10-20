import React from 'react'
import { Layout, Button, Dropdown, Avatar, Space } from 'antd'
import { SettingOutlined, UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import './AdminHeader.css'
import { getUserFullName } from '../../../utils/userData'
import { useLogout } from '../../../hooks/useLogout'
const { Header } = Layout

interface OperatorHeaderProps {
  onMobileMenuToggle?: () => void
  isMobile?: boolean
}

const OperatorHeader: React.FC<OperatorHeaderProps> = ({ onMobileMenuToggle, isMobile }) => {
  const fullName = getUserFullName('Admin User')
  const logout = useLogout()
  const userMenuItems = [
    {
      key: '1',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: '3',
      label: 'Logout',
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
            ? `Welcome, ${fullName.split(' ')[0]}!` 
            : `Welcome back, ${fullName}, let's manage your parking lots !`
          }
        </h3>
      </div>

      <div className="header-right">
        <Space size="middle">
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

export default OperatorHeader
