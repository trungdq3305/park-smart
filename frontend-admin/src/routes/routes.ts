import { lazy } from 'react'
import type { LayoutRoute } from '../types/Route'

// Các layout này được export dưới dạng export default
const MainLayout = lazy(() => import('../components/layouts/layout/MainLayout'))

// --- Các Trang (tải lười - lazy loading) ---
const LandingPage = lazy(() => import('../pages/landing/LandingPage'))

const routes: LayoutRoute[] = [
  {
    layout: MainLayout,
    data: [
      {
        path: '/',
        component: LandingPage,
        exact: true,
      },
    ],
  },
]

export default routes
