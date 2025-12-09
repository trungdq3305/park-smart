import React, { useMemo, useState } from 'react'
import { useGetInvoicesQuery } from '../../../features/operator/invoiceAPI'
import type { OperatorInvoice } from '../../../types/OperatorInvoice'
import './PaymentOperator.css'

type InvoiceFilter = 'all' | 'paid' | 'pending' | 'expired'

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PAID: 'Đã thanh toán',
    PENDING: 'Chờ thanh toán',
    EXPIRED: 'Hết hạn',
  }
  return statusMap[status.toUpperCase()] || status
}

const getStatusClass = (status: string): string => {
  const upperStatus = status.toUpperCase()
  if (upperStatus === 'PAID') return 'invoice-status-paid'
  if (upperStatus === 'PENDING') return 'invoice-status-pending'
  if (upperStatus === 'EXPIRED') return 'invoice-status-expired'
  return 'invoice-status-pending'
}

const formatCurrency = (amount: number, currency: string = 'VND'): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMonth = (monthString: string): string => {
  if (!monthString) return 'N/A'
  const [year, month] = monthString.split('-')
  return `Tháng ${month}/${year}`
}

const PaymentOperator: React.FC = () => {
  const [filter, setFilter] = useState<InvoiceFilter>('all')
  const { data, isLoading, error } = useGetInvoicesQuery({})

  const invoices: OperatorInvoice[] = Array.isArray(data)
    ? data
    : (data as { data?: OperatorInvoice[] })?.data || []

  const stats = useMemo(() => {
    const total = invoices.length
    const paid = invoices.filter((inv) => inv.status.toUpperCase() === 'PAID').length
    const pending = invoices.filter((inv) => inv.status.toUpperCase() === 'PENDING').length
    const expired = invoices.filter((inv) => inv.status.toUpperCase() === 'EXPIRED').length
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const paidAmount = invoices
      .filter((inv) => inv.status.toUpperCase() === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0)

    return { total, paid, pending, expired, totalAmount, paidAmount }
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return invoices
    if (filter === 'paid') return invoices.filter((inv) => inv.status.toUpperCase() === 'PAID')
    if (filter === 'pending')
      return invoices.filter((inv) => inv.status.toUpperCase() === 'PENDING')
    if (filter === 'expired')
      return invoices.filter((inv) => inv.status.toUpperCase() === 'EXPIRED')
    return invoices
  }, [invoices, filter])

  if (isLoading) {
    return (
      <div className="payment-operator-page">
        <div className="invoice-loading">
          <div className="invoice-loading-spinner" />
          <p>Đang tải danh sách hóa đơn...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-operator-page">
        <div className="invoice-error">
          <span className="invoice-error-badge">Lỗi tải dữ liệu</span>
          <p>Không thể tải danh sách hóa đơn. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-operator-page">
      <div className="invoice-page-header">
        <div className="invoice-header-content">
          <div>
            <h1>Quản lý hóa đơn</h1>
            <p>Xem và theo dõi tất cả hóa đơn thanh toán trong hệ thống Park Smart</p>
          </div>
        </div>
      </div>

      <div className="invoice-page-content">
        {/* Stats */}
        <div className="invoice-stats-section">
          <div className="invoice-stat-card">
            <div className="invoice-stat-icon total">📄</div>
            <div className="invoice-stat-content">
              <h3>{stats.total}</h3>
              <p>Tổng hóa đơn</p>
              <div className="invoice-stat-sub">Tất cả hóa đơn</div>
            </div>
          </div>
          <div className="invoice-stat-card">
            <div className="invoice-stat-icon paid">✅</div>
            <div className="invoice-stat-content">
              <h3>{stats.paid}</h3>
              <p>Đã thanh toán</p>
              <div className="invoice-stat-sub">{formatCurrency(stats.paidAmount)}</div>
            </div>
          </div>
          <div className="invoice-stat-card">
            <div className="invoice-stat-icon pending">⏳</div>
            <div className="invoice-stat-content">
              <h3>{stats.pending}</h3>
              <p>Chờ thanh toán</p>
              <div className="invoice-stat-sub">Đang xử lý</div>
            </div>
          </div>
          <div className="invoice-stat-card">
            <div className="invoice-stat-icon expired">⏰</div>
            <div className="invoice-stat-content">
              <h3>{stats.expired}</h3>
              <p>Hết hạn</p>
              <div className="invoice-stat-sub">Đã quá hạn</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="invoice-controls-card">
          <div className="invoice-filter-wrapper">
            <label htmlFor="status-filter" className="invoice-filter-label">
              Lọc theo trạng thái:
            </label>
            <select
              id="status-filter"
              className="invoice-filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as InvoiceFilter)}
            >
              <option value="all">-- Tất cả --</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
          <div className="invoice-counter">
            Đang hiển thị <strong>{filteredInvoices.length}</strong> / {stats.total} hóa đơn
          </div>
        </div>

        {/* Invoice List */}
        {filteredInvoices.length === 0 ? (
          <div className="invoice-empty-state">
            <div className="invoice-empty-icon">📋</div>
            <h3 className="invoice-empty-title">Chưa có hóa đơn nào</h3>
            <p className="invoice-empty-text">
              {filter === 'all'
                ? 'Chưa có hóa đơn nào trong hệ thống.'
                : `Không có hóa đơn với trạng thái "${getStatusLabel(filter.toUpperCase())}".`}
            </p>
          </div>
        ) : (
          <div className="invoice-list">
            {filteredInvoices.map((invoice) => {
              const statusClass = getStatusClass(invoice.status)
              const statusLabel = getStatusLabel(invoice.status)
              const isExpired = invoice.status.toUpperCase() === 'EXPIRED'

              return (
                <div key={invoice.id} className="invoice-item">
                  <div className="invoice-item-header">
                    <div className="invoice-item-title-section">
                      <h3 className="invoice-item-title">
                        Hóa đơn #{invoice.externalId || invoice.id.slice(-8)}
                      </h3>
                      <div className={`invoice-status-badge ${statusClass}`}>
                        <span className="invoice-status-dot" />
                        <span>{statusLabel}</span>
                      </div>
                    </div>
                    <div className="invoice-amount-section">
                      <div className="invoice-amount-label">Tổng tiền</div>
                      <div className="invoice-amount-value">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="invoice-item-body">
                    <div className="invoice-details-grid">
                      <div className="invoice-detail-item">
                        <div className="invoice-detail-icon">📅</div>
                        <div className="invoice-detail-content">
                          <span className="invoice-detail-label">Tháng hóa đơn</span>
                          <span className="invoice-detail-value">
                            {formatMonth(invoice.invoiceMonth)}
                          </span>
                        </div>
                      </div>

                      <div className="invoice-detail-item">
                        <div className="invoice-detail-icon">💳</div>
                        <div className="invoice-detail-content">
                          <span className="invoice-detail-label">Phương thức</span>
                          <span className="invoice-detail-value">
                            {invoice.paymentType || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="invoice-detail-item">
                        <div className="invoice-detail-icon">📆</div>
                        <div className="invoice-detail-content">
                          <span className="invoice-detail-label">Hạn thanh toán</span>
                          <span
                            className={`invoice-detail-value ${
                              isExpired ? 'invoice-expired-date' : ''
                            }`}
                          >
                            {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="invoice-detail-item">
                        <div className="invoice-detail-icon">🆔</div>
                        <div className="invoice-detail-content">
                          <span className="invoice-detail-label">Mã hóa đơn</span>
                          <span className="invoice-detail-value">{invoice.id.slice(-12)}</span>
                        </div>
                      </div>
                    </div>

                    {invoice.paidAt && (
                      <div className="invoice-paid-info">
                        <span className="invoice-paid-label">✅ Đã thanh toán:</span>
                        <span className="invoice-paid-value">{formatDate(invoice.paidAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="invoice-item-footer">
                    <div className="invoice-date-info">
                      <div className="invoice-date-item">
                        <span className="invoice-date-label">Tạo lúc:</span>
                        <span className="invoice-date-value">{formatDate(invoice.createdAt)}</span>
                      </div>
                      {invoice.updatedAt !== invoice.createdAt && (
                        <div className="invoice-date-item">
                          <span className="invoice-date-label">Cập nhật:</span>
                          <span className="invoice-date-value">
                            {formatDate(invoice.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {invoice.checkoutUrl && invoice.status.toUpperCase() === 'PENDING' && (
                      <a
                        href={invoice.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="invoice-pay-btn"
                      >
                        Thanh toán ngay
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentOperator
