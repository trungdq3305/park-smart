import React from 'react'
import { Layout, Menu, Button } from 'antd'
import {
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BankOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CarOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  HistoryOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import './AdminSidebar.css'

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
  onMobileToggle,
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Menu items aligned to Admin sidebar
  const menuItems = [
    {
      key: '/operator',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/operator/parking-lot',
      icon: <CarOutlined />,
      label: 'Bãi đỗ xe',
    },
    {
      key: '/operator/control-panel',
      icon: <DashboardOutlined />,
      label: 'Bảng điều khiển',
    },
    {
      key: '/operator/parking-lot-session-history',
      icon: <EnvironmentOutlined />,
      label: 'Lịch sử phiên đỗ xe',
    },
    {
      key: '/operator/dashboard',
      icon: <BarChartOutlined />,
      label: 'Phân tích nâng cao',
    },
    {
      key: '/operator/create-report',
      icon: <FileTextOutlined />,
      label: 'Tạo báo cáo',
    },
    {
      key: '/integrations',
      icon: <AppstoreOutlined />,
      label: 'Tích hợp',
    },
    {
      key: '/companies',
      icon: <BankOutlined />,
      label: 'Doanh nghiệp',
    },
    {
      key: '/vehicles',
      icon: <CarOutlined />,
      label: 'Phương tiện',
    },
    {
      key: '/operator/payment',
      icon: <WalletOutlined />,
      label: 'Thanh toán',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: 'Lịch sử',
    },
    {
      key: '/operator/import-card',
      icon: <SafetyOutlined />,
      label: 'Thêm thẻ',
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
      className={`admin-sidebar ${isMobile && mobileOpen ? 'mobile-open' : ''}`}
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
