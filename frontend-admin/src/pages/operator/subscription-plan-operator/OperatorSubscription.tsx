import React from 'react'
import { useGetDefaultPlanQuery } from '../../../features/admin/subscriptionAPI'
import type { SubscriptionPlan } from '../../../types/Subscription'
import { SubscriptionPlanDisplay } from '../../../components/subscription-plan'
import '../../../components/subscription-plan/SubscriptionPlanDisplay.css'

const SubscriptionPlanOperator: React.FC = () => {
  const { data, isLoading, error } = useGetDefaultPlanQuery({})
  const plan = (data as any) as SubscriptionPlan | undefined

  if (isLoading) {
    return (
      <SubscriptionPlanDisplay
        plan={{} as SubscriptionPlan}
        isLoading={true}
        title="Gói Đăng Ký"
      />
    )
  }

  if (error) {
    return (
      <div className="sub-plan-page">
        <div className="sub-plan-error">
          <div className="sub-plan-error-icon">⚠️</div>
          <h2>Không thể tải thông tin gói đăng ký</h2>
          <p>{(error as any)?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu'}</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="sub-plan-page">
        <div className="sub-plan-empty">
          <div className="sub-plan-empty-icon">📋</div>
          <h2>Chưa có gói đăng ký</h2>
          <p>Hiện tại chưa có gói đăng ký nào được thiết lập.</p>
        </div>
      </div>
    )
  }

  return (
    <SubscriptionPlanDisplay
      plan={plan}
      title="Gói Đăng Ký"
      showEditButton={false}
    />
  )
}

export default SubscriptionPlanOperator