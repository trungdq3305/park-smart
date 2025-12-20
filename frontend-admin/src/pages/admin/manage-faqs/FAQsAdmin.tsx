import React, { useMemo, useState } from 'react'
import { useGetFAQsQuery } from '../../../features/admin/FAQsAPI'
import type { FAQ } from '../../../types/FAQs'
import { FAQStats, FAQFilters, FAQList, filterFAQs, calculateFAQStats, type FAQFilter } from '../../../components/faqs'
import './ManageFAQsAdmin.css'

const FAQsAdmin: React.FC = () => {
  const [filter, setFilter] = useState<FAQFilter>('all')

  const { data, isLoading, error } = useGetFAQsQuery({ page: 1, pageSize: 100 })
  const faqs: FAQ[] = ((data as any)?.data?.data ?? []) as FAQ[]

  const stats = useMemo(() => calculateFAQStats(faqs), [faqs])

  const filteredFaqs = useMemo(() => filterFAQs(faqs, filter), [faqs, filter])

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
        <div>
          <h1>Quản lý FAQs</h1>
          <p>Xem và theo dõi các câu hỏi thường gặp trong hệ thống Park Smart</p>
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

        <FAQList faqs={filteredFaqs} filter={filter} />
      </div>
    </div>
  )
}

export default FAQsAdmin
