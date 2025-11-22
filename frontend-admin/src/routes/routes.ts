import { lazy } from 'react'
import type { LayoutRoute } from '../types/Route'

// Các layout này được export dưới dạng export default
const MainLayout = lazy(() => import('../components/layouts/layout/MainLayout'))
const AdminLayout = lazy(() => import('../components/layouts/layout/AdminLayout'))
const OperatorLayout = lazy(() => import('../components/layouts/layout/OperatorLayout'))
// --- Các Trang (tải lười - lazy loading) ---
const LoginPage = lazy(() => import('../pages/LoginPage'))
const ManageAccountPage = lazy(() => import('../pages/admin/manage-account/ManageAccountPage'))
const CreateParkingLot = lazy(() => import('../pages/operator/create-parking-lot/CreateParkingLot'))
const ManageTermsPolicies = lazy(() => import('../pages/admin/terms-policies/ManageTermsPolicies'))
const ManageReport = lazy(() => import('../pages/admin/manage-report/ManageReport'))
const CreateReport = lazy(() => import('../pages/operator/create-report/CreateReport'))
const ManageParkingLots = lazy(() => import('../pages/admin/manage-parking-lots/ManageParkingLots'))
const OperatorParkingLot = lazy(() => import('../pages/operator/parking-lot/ParkingLot'))
const BulkImportPage = lazy(() => import('../pages/operator/import-card/BulkImportPage'))
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
      {
        path: '/admin/terms-policies',
        component: ManageTermsPolicies,
        role: ['Admin'],
      },
      {
        path: '/admin/reports',
        component: ManageReport,
        role: ['Admin'],
      },
      {
        path: '/admin/manage-parking-lots',
        component: ManageParkingLots,
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
      {
        path: '/operator/create-parking-lot-request',
        component: CreateParkingLot,
        role: ['Operator'],
      },
      {
        path: '/operator/create-report',
        component: CreateReport,
        role: ['Operator'],
      },
      {
        path: '/operator/parking-lot',
        component: OperatorParkingLot,
        role: ['Operator'],
      },
      {
        path: '/operator/import-card',
        component: BulkImportPage,
        role: ['Operator'],
      },
    ],
  },
]

export default routes
