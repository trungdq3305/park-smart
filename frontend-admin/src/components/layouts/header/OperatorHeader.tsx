import React from 'react'
import { Layout, Button, Dropdown, Avatar, Space } from 'antd'
import { SettingOutlined, UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import './OperatorHeader.css'
import Cookies from 'js-cookie'
const { Header } = Layout

interface OperatorHeaderProps {
  onMobileMenuToggle?: () => void
  isMobile?: boolean
}

const OperatorHeader: React.FC<OperatorHeaderProps> = ({ onMobileMenuToggle, isMobile }) => {
  const userData = Cookies.get('userData') ? JSON.parse(Cookies.get('userData')!) : null
  const fullName = userData?.fullName || 'Operator User'
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
    },
  ]

  return (
    <Header className="operator-header">
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
            : `Welcome back, ${fullName}, let's manage your parking operations !`
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
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
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
