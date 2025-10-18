import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import AdminHeader from '../header/AdminHeader'
import AdminSidebar from '../sideBar/AdminSidebar'

const { Content } = Layout

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const handleOverlayClick = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const handleCollapse = useCallback((collapsed: boolean) => {
    setCollapsed(collapsed)
  }, [])

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <AdminSidebar 
        collapsed={collapsed} 
        onCollapse={handleCollapse}
        isMobile={isMobile}
        mobileOpen={mobileMenuOpen}
        onMobileToggle={handleMobileMenuToggle}
      />
      
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-overlay show"
          onClick={handleOverlayClick}
        />
      )}
      
      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? '10vh' : '35vh'),
          transition: 'margin-left 0.3s ease',
          background: '#f5f5f5',
        }}
      >
        <AdminHeader 
          onMobileMenuToggle={handleMobileMenuToggle}
          isMobile={isMobile}
        />
        <Content
          style={{
            margin: isMobile ? '0.8vh' : '1.6vh',
            padding: isMobile ? '1.6vh' : '2.4vh',
            background: '#ffffff',
            borderRadius: isMobile ? '1.2vh' : '2vh',
            boxShadow: '0 0.1vh 0.3vh rgba(0, 0, 0, 0.1)',
            minHeight: isMobile ? 'calc(100vh - 8vh)' : 'calc(100vh - 12vh)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
