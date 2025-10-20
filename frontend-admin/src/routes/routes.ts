import { lazy } from 'react'
import type { LayoutRoute } from '../types/Route'

// Các layout này được export dưới dạng export default
const MainLayout = lazy(() => import('../components/layouts/layout/MainLayout'))
const AdminLayout = lazy(() => import('../components/layouts/layout/AdminLayout'))
const OperatorLayout = lazy(() => import('../components/layouts/layout/OperatorLayout'))
// --- Các Trang (tải lười - lazy loading) ---
const LoginPage = lazy(() => import('../pages/LoginPage'))
const ManageAccountPage = lazy(() => import('../pages/admin/ManageAccountPage'))

const routes: LayoutRoute[] = [
  {
    layout: MainLayout,
    data: [
      {
        path: '/login',
        component: LoginPage,
      },
    ],
  },
  {
    layout: AdminLayout,
    data: [
      {
        path: '/admin',
        component: ManageAccountPage,
        role: ['Admin'],
      },
      {
        path: '/admin/manage-account',
        component: ManageAccountPage,
        role: ['Admin'],
      },
    ],
  },
  {
    layout: OperatorLayout,
    data: [
      {
        path: '/operator',
        component: ManageAccountPage, // You can create a specific operator dashboard component later
        role: ['Operator'],
      },
    ],
  },
]

export default routes
