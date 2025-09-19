import { Route, Routes } from 'react-router-dom'
import routes from './routes/routes'
import PermissionCheck from './components/permission/PermissionCheck'
import NotFound from './components/not-found/NotFound'
import { useAutoLogout } from './hooks/useAutoLogout'
import { Suspense } from 'react'
import { Spin } from 'antd'
function App() {
  useAutoLogout()

  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Spin size='large' />
        </div>
      }
    >
      <Routes>
        {routes.map((route, i) => {
          const Layout = route.layout
          return (
            <Route
              key={i}
              // Bọc Layout trong PermissionCheck và truyền vào role của cả nhóm layout
              element={
                <PermissionCheck protectedRole={route.role}>
                  <Layout />
                </PermissionCheck>
              }
            >
              {route.data.map((item) => {
                const Component = item.component
                return (
                  <Route
                    key={item.path}
                    path={item.path}
                    // Ở trong này không cần PermissionCheck nữa vì cả layout đã được bảo vệ
                    element={<Component />}
                  />
                )
              })}
            </Route>
          )
        })}

        {/* Trang fallback */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
