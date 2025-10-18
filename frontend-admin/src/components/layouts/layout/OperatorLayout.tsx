import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import OperatorHeader from '../header/OperatorHeader'
import OperatorSidebar from '../sideBar/OperatorSidebar'

const { Content } = Layout

function OperatorLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
      }}
    >
      <OperatorSidebar 
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
        <OperatorHeader />
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

export default OperatorLayout