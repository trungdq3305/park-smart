import React from 'react'
import { Layout, Menu, Button } from 'antd'
import {
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CarOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import './OperatorSidebar.css'

const { Sider } = Layout

interface OperatorSidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  isMobile?: boolean
  mobileOpen?: boolean
  onMobileToggle?: () => void
}

const OperatorSidebar: React.FC<OperatorSidebarProps> = ({ 
  collapsed, 
  onCollapse, 
  isMobile = false, 
  mobileOpen = false,
  onMobileToggle 
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Menu items for operator dashboard
  const menuItems = [
    {
      key: '/operator/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/operator/parking-spots',
      icon: <EnvironmentOutlined />,
      label: 'Parking Spots',
      badge: '12/15',
      active: true,
    },
    {
      key: '/operator/vehicles',
      icon: <CarOutlined />,
      label: 'Vehicles',
    },
    {
      key: '/operator/payments',
      icon: <WalletOutlined />,
      label: 'Payments',
    },
    {
      key: '/operator/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/operator/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
    },
    {
      key: '/operator/history',
      icon: <HistoryOutlined />,
      label: 'History',
    },
    {
      key: '/operator/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: '/operator/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
    // Close mobile menu after navigation
    if (isMobile && onMobileToggle) {
      onMobileToggle()
    }
  }

  const selectedKeys = [location.pathname]

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={isMobile ? false : collapsed}
      className={`operator-sidebar ${isMobile && mobileOpen ? 'mobile-open' : ''}`}
      width={isMobile ? 280 : 280}
      collapsedWidth={isMobile ? 0 : 80}
    >
      <div className="sidebar-content">
        {/* Header Section */}
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo">
              <div className="logo-icon">
                <CarOutlined />
              </div>
              {!collapsed && <span className="logo-text">Park Smart</span>}
            </div>
            {!isMobile && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => onCollapse(!collapsed)}
                className="collapse-btn"
              />
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="navigation-section">
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: (
                <div className="menu-item-content">
                  <span className="menu-label">{item.label}</span>
                  {item.badge && (
                    <span className={`menu-badge ${item.active ? 'active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ),
            }))}
            onClick={handleMenuClick}
            className="navigation-menu"
          />
        </div>
      </div>
    </Sider>
  )
}

export default OperatorSidebar
