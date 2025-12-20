import React from 'react'

interface FAQStatsProps {
  total: number
  admin: number
  operator: number
}

export const FAQStats: React.FC<FAQStatsProps> = ({ total, admin, operator }) => {
  return (
    <div className="faq-stats-section">
      <div className="faq-stat-card">
        <div className="faq-stat-icon total">❓</div>
        <div className="faq-stat-content">
          <h3>{total}</h3>
          <p>Tổng số FAQs</p>
          <div className="faq-stat-sub">Tất cả câu hỏi thường gặp</div>
        </div>
      </div>
      <div className="faq-stat-card">
        <div className="faq-stat-icon admin">🛠️</div>
        <div className="faq-stat-content">
          <h3>{admin}</h3>
          <p>Admin tạo</p>
          <div className="faq-stat-sub">FAQs được cấu hình bởi quản trị viên</div>
        </div>
      </div>
      <div className="faq-stat-card">
        <div className="faq-stat-icon operator">🏢</div>
        <div className="faq-stat-content">
          <h3>{operator}</h3>
          <p>Operator tạo</p>
          <div className="faq-stat-sub">FAQs đến từ nhà vận hành bãi xe</div>
        </div>
      </div>
    </div>
  )
}

export default FAQStats
