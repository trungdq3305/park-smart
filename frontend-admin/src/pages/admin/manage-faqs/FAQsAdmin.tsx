import React, { useMemo, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { useGetFAQsQuery } from '../../../features/admin/FAQsAPI'
import type { FAQ } from '../../../types/FAQs'
import {
  FAQStats,
  FAQFilters,
  FAQList,
  CreateFAQModal,
  UpdateFAQModal,
  filterFAQs,
  calculateFAQStats,
  type FAQFilter,
} from '../../../components/faqs'
import './ManageFAQsAdmin.css'

const FAQsAdmin: React.FC = () => {
  const [filter, setFilter] = useState<FAQFilter>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null)

  const { data, isLoading, error } = useGetFAQsQuery({ page: 1, pageSize: 100 })
  const faqs: FAQ[] = ((data as any)?.data?.data ?? []) as FAQ[]

  const stats = useMemo(() => calculateFAQStats(faqs), [faqs])

  const filteredFaqs = useMemo(() => filterFAQs(faqs, filter), [faqs, filter])

  const handleOpenUpdateModal = (faq: FAQ) => {
    setSelectedFAQ(faq)
    setIsUpdateModalOpen(true)
  }

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false)
    setSelectedFAQ(null)
  }

  if (isLoading) {
    return (
      <div className="manage-faqs-admin-page">
        <div className="faq-loading">
          <div className="faq-loading-spinner" />
          <p>Đang tải danh sách FAQs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="manage-faqs-admin-page">
        <div className="faq-error">
          <span className="faq-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách FAQs. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="manage-faqs-admin-page">
      <div className="faq-page-header">
        <div className="faq-header-content">
          <div>
            <h1>Quản lý FAQs</h1>
            <p>Xem và theo dõi các câu hỏi thường gặp trong hệ thống Park Smart</p>
          </div>
          <button className="faq-create-btn" onClick={() => setIsCreateModalOpen(true)}>
            <PlusOutlined />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      <div className="faq-page-content">
        <FAQStats total={stats.total} admin={stats.admin} operator={stats.operator} />

        <FAQFilters
          filter={filter}
          onChange={setFilter}
          total={stats.total}
          admin={stats.admin}
          operator={stats.operator}
          filteredCount={filteredFaqs.length}
        />

        <FAQList faqs={filteredFaqs} filter={filter} onEdit={handleOpenUpdateModal} />
      </div>

      <CreateFAQModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <UpdateFAQModal
        open={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        faq={selectedFAQ}
      />
    </div>
  )
}

export default FAQsAdmin
