import React from 'react'
import { Layout, Breadcrumb, Button, Dropdown, Menu, Avatar, Space } from 'antd'
import {
  ShareAltOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useBreadcrumb } from '../../../hooks/useBreadcrumb'
import './AdminHeader.css'

const { Header } = Layout

const AdminHeader: React.FC = () => {
  const breadcrumbItems = useBreadcrumb()
  
  const userMenu = (
    <Menu
      items={[
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
          type: 'divider',
        },
        {
          key: '3',
          label: 'Logout',
          icon: <LogoutOutlined />,
          danger: true,
        },
      ]}
    />
  )

  return (
    <Header className="admin-header">
      <div className="header-left">
        <Breadcrumb
          items={breadcrumbItems}
          separator=">"
          style={{ fontSize: '14px', color: '#8c8c8c' }}
        />
      </div>

      <div className="header-right">
        <Space size="middle">
          <Button
            type="text"
            icon={<BellOutlined />}
            className="header-action-btn"
          />
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            className="header-action-btn"
          />
          <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
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
              Admin User
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  )
}

export default AdminHeader
