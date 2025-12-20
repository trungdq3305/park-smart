import React, { useState } from 'react'
import {
  useGetDefaultPlanQuery,
  useUpdateDefaultPlanMutation,
} from '../../../features/admin/subscriptionAPI'
import type { SubscriptionPlan } from '../../../types/Subscription'
import {
  SubscriptionPlanDisplay,
  EditSubscriptionPlanModal,
} from '../../../components/subscription-plan'
import './SubscriptionPlan.css'

const SubscriptionPlanPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useGetDefaultPlanQuery({})
  const [updatePlan, { isLoading: isUpdating }] = useUpdateDefaultPlanMutation()

  const plan = data as any as SubscriptionPlan | undefined
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleUpdatePlan = async (formData: {
    name: string
    description: string
    monthlyFeeAmount: number
    billingDayOfMonth: number
    gracePeriodDays: number
    penaltyFeeAmount: number
    maxOverdueMonthsBeforeSuspension: number
    isActive: boolean
  }) => {
    await updatePlan(formData).unwrap()
    refetch()
  }

  if (isLoading) {
    return <SubscriptionPlanDisplay plan={{} as SubscriptionPlan} isLoading={true} />
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
    <>
      <SubscriptionPlanDisplay
        plan={plan}
        title="Gói Đăng Ký Mặc Định"
        showEditButton={true}
        onEditClick={() => setIsEditModalOpen(true)}
      />
      <EditSubscriptionPlanModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        plan={plan}
        onSubmit={handleUpdatePlan}
        isLoading={isUpdating}
      />
    </>
  )
}

export default SubscriptionPlanPage
