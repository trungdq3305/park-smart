import React from 'react'
import { Layout, Button, Dropdown, Avatar, Space } from 'antd'
import {
  SettingOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import './OperatorHeader.css'
import Cookies from 'js-cookie'
const { Header } = Layout

const OperatorHeader: React.FC = () => {
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
      <div className="header-left">
       <h3>Welcome back, {fullName}, let's manage your parking operations !</h3>
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
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
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

export default OperatorHeader
