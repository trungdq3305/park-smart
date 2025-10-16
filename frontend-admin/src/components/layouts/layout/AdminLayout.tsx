import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import AdminHeader from '../header/AdminHeader'
import AdminSidebar from '../sideBar/AdminSidebar'

const { Content } = Layout

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <AdminSidebar 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
      />
      <Layout
        style={{
          marginLeft: collapsed ? '10vh' : '35vh',
          transition: 'margin-left 0.2s ease',
          background: '#f5f5f5',
        }}
      >
        <AdminHeader />
        <Content
          style={{
            margin: '1.6vh',
            padding: '2.4vh',
            background: '#ffffff',
            borderRadius: '2vh',
            boxShadow: '0 0.1vh 0.3vh rgba(0, 0, 0, 0.1)',
            minHeight: 'calc(100vh - 12vh)',
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
