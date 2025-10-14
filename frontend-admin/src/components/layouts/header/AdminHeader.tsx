import React from 'react'
import { Layout, Button, Dropdown, Avatar, Space } from 'antd'
import {
  SettingOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import './AdminHeader.css'
import Cookies from 'js-cookie'
const { Header } = Layout

const AdminHeader: React.FC = () => {
  const userData = Cookies.get('userData') ? JSON.parse(Cookies.get('userData')!) : null
  const fullName = userData?.fullName || 'Admin User'
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
    <Header className="admin-header">
      <div className="header-left">
       <h3>Welcome back, {fullName}, let's manage your parking lots !</h3>
      </div>

      <div className="header-right">
        <Space size="middle">
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              className="user-menu-btn"
            >
              <Avatar 
                size={32} 
                icon={<UserOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  marginRight: '8px'
                }}
              />
              {fullName}
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  )
}

export default AdminHeader
