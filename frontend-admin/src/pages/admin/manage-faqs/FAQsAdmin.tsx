import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Modal, message } from 'antd'
import { useGetFAQsQuery, useDeleteFAQMutation } from '../../../features/admin/FAQsAPI'
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
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [allFAQs, setAllFAQs] = useState<FAQ[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null)

  const pageSize = 5 // Fixed page size

  // Reset page and FAQs when filter changes
  useEffect(() => {
    setCurrentPage(1)
    setAllFAQs([])
  }, [filter])

  const { data, isLoading, error, refetch } = useGetFAQsQuery({ page: currentPage, pageSize })
  const [deleteFAQ, { isLoading: isDeleting }] = useDeleteFAQMutation()
  
  // Accumulate data when new page is loaded - exactly like ManageGuestCard
  useEffect(() => {
    // Extract data from response - handle both possible structures
    const responseData = (data as any)?.data?.data || (data as any)?.data
    if (responseData) {
      if (currentPage === 1) {
        // First page - replace all
        setAllFAQs(responseData)
      } else {
        // Subsequent pages - append
        setAllFAQs((prev) => [...prev, ...responseData])
      }
    }
  }, [data, currentPage])

  const faqs: FAQ[] = allFAQs
  const pagination = (data as any)?.data?.pagination || (data as any)?.pagination
  const hasMorePages = pagination ? currentPage < pagination.totalPages : false

  const stats = useMemo(() => calculateFAQStats(faqs), [faqs])

  const filteredFaqs = useMemo(() => filterFAQs(faqs, filter), [faqs, filter])

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMorePages) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [isLoading, hasMorePages])

  const handleOpenUpdateModal = (faq: FAQ) => {
    setSelectedFAQ(faq)
    setIsUpdateModalOpen(true)
  }

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false)
    setSelectedFAQ(null)
  }

  const handleDeleteFAQ = (faqId: string, faqQuestion: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa FAQ',
      content: `Bạn có chắc chắn muốn xóa FAQ "${faqQuestion}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const result = await deleteFAQ(faqId).unwrap()
          message.success(result?.message || 'Xóa FAQ thành công')
          // Reset to page 1 and refetch
          setCurrentPage(1)
          setAllFAQs([])
          refetch()
        } catch (error: any) {
          message.error(error?.data?.message || 'Xóa FAQ thất bại')
        }
      },
    })
  }

  if (isLoading && currentPage === 1) {
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

        <FAQList
          faqs={filteredFaqs}
          filter={filter}
          onEdit={handleOpenUpdateModal}
          onDelete={handleDeleteFAQ}
          isDeleting={isDeleting}
          hasMorePages={hasMorePages}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          totalItems={pagination?.totalItems}
        />
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
