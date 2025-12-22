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
const KioskPage = lazy(() => import('../pages/operator/parking-lot-operate/KioskPage'))
const ParkingLotSessionHistory = lazy(
  () => import('../pages/operator/parking-lot-session-history/ParkingLotSessionHistory')
)
const PaymentOperator = lazy(() => import('../pages/operator/payment/PaymentOperator'))
const DashboardOperator = lazy(() => import('../pages/operator/dashboard/dashboardOperator'))
const ManageEventsAdmin = lazy(() => import('../pages/admin/manage-events/ManageEventsAdmin'))
const ManageEventsOperator = lazy(
  () => import('../pages/operator/manage-events/ManageEventsOperator')
)
const ManageGuestCard = lazy(() => import('../pages/operator/manage-guest-card/ManageGuestCard'))
const ManagePromotion = lazy(() => import('../pages/operator/manage-promotion/ManagePromotion'))
const ManagePromotionsAdmin = lazy(
  () => import('../pages/admin/manage-promotions/ManagePromotionsAdmin')
)
const DashboardAdmin = lazy(() => import('../pages/admin/dashboard-admin/DashboardAdmin'))
const ManagePayment = lazy(() => import('../pages/admin/manage-payment/ManagePayment'))
const PaymentConfirm = lazy(() => import('../pages/operator/payment-confirm/PaymentConfirm'))
const SubscriptionPlanPage = lazy(() => import('../pages/admin/subscription-plan/SubscriptionPlan'))
const SubscriptionPlanOperator = lazy(
  () => import('../pages/operator/subscription-plan-operator/OperatorSubscription')
)
const FAQsAdmin = lazy(() => import('../pages/admin/manage-faqs/FAQsAdmin'))
const ManageFAQsOperator = lazy(() => import('../pages/operator/manage-faqs/ManageFAQsOperator'))
const ManageProfile = lazy(() => import('../pages/profile/ManageProfile'))
const ManageAnnouncement = lazy(() => import('../pages/admin/manage-annoucement/ManageAnnoucement'))
const ManageRequest = lazy(() => import('../pages/admin/manage-request/ManageRequest'))
const OperatorChat = lazy(() => import('../pages/operator/chat-with-driver/OperatorChat'))
const routes: LayoutRoute[] = [
  {
    layout: MainLayout,
    data: [
      {
        path: '/',
        component: LoginPage,
      },
      {
        path: '/pay-result',
        component: PaymentConfirm,
      },
      {
        path: '/profile',
        component: ManageProfile,
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
      {
        path: '/admin/parking-lot-requests',
        component: ManageRequest,
        role: ['Admin'],
      },
      {
        path: '/admin/events',
        component: ManageEventsAdmin,
        role: ['Admin'],
      },
      {
        path: '/admin/promotions',
        component: ManagePromotionsAdmin,
        role: ['Admin'],
      },
      {
        path: '/admin/dashboard-admin',
        component: DashboardAdmin,
        role: ['Admin'],
      },
      {
        path: '/admin/payments',
        component: ManagePayment,
        role: ['Admin'],
      },
      {
        path: '/admin/subscription-plan',
        component: SubscriptionPlanPage,
        role: ['Admin'],
      },
      {
        path: '/admin/faqs',
        component: FAQsAdmin,
        role: ['Admin'],
      },
      {
        path: '/admin/announcements',
        component: ManageAnnouncement,
        role: ['Admin'],
      },
    ],
  },
  {
    layout: OperatorLayout,
    data: [
      {
        path: '/operator',
        component: DashboardOperator,
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
      {
        path: '/operator/control-panel',
        component: KioskPage,
        role: ['Operator'],
      },
      {
        path: '/operator/parking-lot-session-history',
        component: ParkingLotSessionHistory,
        role: ['Operator'],
      },
      {
        path: '/operator/payment',
        component: PaymentOperator,
        role: ['Operator'],
      },
      {
        path: '/operator/dashboard',
        component: DashboardOperator,
        role: ['Operator'],
      },
      {
        path: '/operator/events',
        component: ManageEventsOperator,
        role: ['Operator'],
      },
      {
        path: '/operator/promotions',
        component: ManagePromotion,
        role: ['Operator'],
      },
      {
        path: '/operator/manage-faqs',
        component: ManageFAQsOperator,
        role: ['Operator'],
      },
      {
        path: '/operator/manage-guest-card',
        component: ManageGuestCard,
        role: ['Operator'],
      },
      {
        path: '/operator/subscription-plan',
        component: SubscriptionPlanOperator,
        role: ['Operator'],
      },
      {
        path: '/operator/chat-with-driver',
        component: OperatorChat,
        role: ['Operator'],
      },
    ],
  },
]

export default routes
