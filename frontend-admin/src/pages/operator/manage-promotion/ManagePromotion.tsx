import React, { useMemo, useState } from 'react'
import {
  useGetPromotionsOperatorQuery,
  useDeletePromotionMutation,
} from '../../../features/operator/promotionAPI'
import { useOperatorId } from '../../../hooks/useOperatorId'
import type { Promotion } from '../../../types/Promotion'
import { PlusOutlined } from '@ant-design/icons'
import { Modal, message } from 'antd'
import {
  PromotionStats,
  PromotionFilters,
  PromotionList,
  PromotionEmptyState,
  CreatePromotionModal,
  UpdatePromotionModal,
  getPromotionStatus,
  type PromotionFilter,
} from '../../../components/promotions'
import './ManagePromotion.css'

const ManagePromotion: React.FC = () => {
  const operatorId = useOperatorId()
  const [filter, setFilter] = useState<PromotionFilter>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const { data, isLoading, error } = useGetPromotionsOperatorQuery({ operatorId })
  const [deletePromotion] = useDeletePromotionMutation()

  const promotions: Promotion[] = Array.isArray(data)
    ? data
    : (data as { data?: Promotion[] })?.data || []

  const stats = useMemo(() => {
    const total = promotions.length
    let active = 0
    let inactive = 0
    let upcoming = 0
    let ended = 0
    let exhausted = 0

    promotions.forEach((promotion) => {
      const status = getPromotionStatus(promotion)
      if (status.class === 'promotion-status-active') active += 1
      if (status.class === 'promotion-status-inactive') inactive += 1
      if (status.class === 'promotion-status-upcoming') upcoming += 1
      if (status.class === 'promotion-status-ended') ended += 1
      if (status.class === 'promotion-status-exhausted') exhausted += 1
    })

    return { total, active, inactive, upcoming, ended, exhausted }
  }, [promotions])

  const filteredPromotions = useMemo(() => {
    if (filter === 'all') return promotions
    return promotions.filter((promotion) => {
      const status = getPromotionStatus(promotion)
      if (filter === 'active') return status.class === 'promotion-status-active'
      if (filter === 'inactive') return status.class === 'promotion-status-inactive'
      if (filter === 'upcoming') return status.class === 'promotion-status-upcoming'
      if (filter === 'ended') return status.class === 'promotion-status-ended'
      if (filter === 'exhausted') return status.class === 'promotion-status-exhausted'
      return true
    })
  }, [promotions, filter])

  const handleDeletePromotion = (promotionId: string, promotionName: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa khuyến mãi',
      content: `Bạn có chắc chắn muốn xóa khuyến mãi "${promotionName}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deletePromotion(promotionId).unwrap()
          message.success('Xóa khuyến mãi thành công')
        } catch (error: any) {
          message.error(error?.data?.message || 'Xóa khuyến mãi thất bại')
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="manage-promotion-page">
        <div className="promotion-loading">
          <div className="promotion-loading-spinner" />
          <p>Đang tải danh sách khuyến mãi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-promotion-page">
        <div className="promotion-error">
          <span className="promotion-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-promotion-page">
      <div className="promotion-page-header">
        <div className="promotion-header-content">
          <div>
            <h1>Quản lý khuyến mãi</h1>
            <p>Xem và quản lý tất cả các chương trình khuyến mãi của bạn</p>
          </div>
          <button className="promotion-create-btn" onClick={() => setIsCreateModalOpen(true)}>
            <PlusOutlined />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      <div className="promotion-page-content">
        <PromotionStats stats={stats} />

        <PromotionFilters
          filter={filter}
          onFilterChange={setFilter}
          totalCount={stats.total}
          filteredCount={filteredPromotions.length}
        />

        {filteredPromotions.length === 0 ? (
          <PromotionEmptyState filter={filter} />
        ) : (
          <PromotionList
            promotions={filteredPromotions}
            onEdit={(promotion) => {
              setSelectedPromotion(promotion)
              setIsUpdateModalOpen(true)
            }}
            onDelete={handleDeletePromotion}
          />
        )}
      </div>

      <CreatePromotionModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <UpdatePromotionModal
        open={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false)
          setSelectedPromotion(null)
        }}
        promotion={selectedPromotion}
      />
    </div>
  )
}

export default ManagePromotion
