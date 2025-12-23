import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useGetPaymentsQuery } from '../../../features/admin/paymentAdminAPI'
import { useGetAccountQuery } from '../../../features/admin/accountAPI'
import './ManagePayment.css'

type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED'

const statusOptions: PaymentStatus[] = ['PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED']
const paymentTypes = [
  'OperatorCharge',
  'PenaltyCharge',
  'ParkingLotSession',
  'Subscription',
  'Reservation',
]

const ManagePayment: React.FC = () => {
  const [filters, setFilters] = useState({
    operatorId: '',
    status: '',
    paymentType: '',
    fromDate: '',
    toDate: '',
  })

  const {
    data: accountRes,
    isLoading: isLoadingAccounts,
    error: accountError,
  } = useGetAccountQuery({ page: 1, pageSize: 200 })

  const params = useMemo(() => {
    const p: Record<string, any> = { ...filters }
    Object.entries(p).forEach(([k, v]) => {
      if (v === '' || v === undefined || v === null) {
        delete p[k]
      }
    })
    return p
  }, [filters])

  const { data, isLoading, error, refetch, isFetching } = useGetPaymentsQuery({ params })

  const payments = (data as any)?.data ?? (data as any) ?? []
  const notFoundError =
    (error as any)?.status === 404 ||
    (error as any)?.originalStatus === 404 ||
    (error as any)?.data?.statusCode === 404

  const stats = useMemo(() => {
    const total = payments.length
    const byStatus: Record<string, number> = {}
    payments.forEach((p: any) => {
      const key = p.status || 'UNKNOWN'
      byStatus[key] = (byStatus[key] || 0) + 1
    })
    return { total, byStatus }
  }, [payments])

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClear = () => {
    setFilters({
      operatorId: '',
      status: '',
      paymentType: '',
      fromDate: '',
      toDate: '',
    })
  }
  console.log(accountRes)
  const operatorOptions = useMemo(() => {
    const paged = (accountRes as any)?.data?.pagedAccounts
    const listRaw = paged?.data ?? []
    const list: any[] = Array.isArray(listRaw) ? listRaw : []
    return list
      .filter((acc: any) => acc?.operatorDetail?._id)
      .map((acc: any) => {
        const op = acc.operatorDetail || {}
        const label =
          op.name || op.displayName || op.parkingLotName || acc.fullName || acc.email || op._id
        return { id: op._id, label }
      })
  }, [accountRes])

  const formatMoney = (val?: number) =>
    val !== undefined && val !== null
      ? val.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
      : '-'

  const formatDate = (val?: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')

  return (
    <div className="pay-page">
      <div className="pay-hero">
        <div>
          <p className="pay-kicker">Admin • Payments</p>
          <h1>Quản lý hoá đơn</h1>
          <p className="pay-subtitle">Theo dõi giao dịch, trạng thái và chi tiết thanh toán</p>
          <div className="pay-hero-badges">
            <span className="pay-badge">Tổng: {stats.total}</span>
            {Object.entries(stats.byStatus).map(([k, v]) => (
              <span key={k} className="pay-badge ghost">
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
        <div className="pay-hero-actions">
          <button className="pay-btn subtle" onClick={() => refetch()} disabled={isFetching}>
            Làm mới
          </button>
        </div>
      </div>

      <div className="pay-panel">
        <div className="pay-panel-header">
          <div>
            <h3>Bộ lọc</h3>
            <p>Lọc theo operator, trạng thái, khoảng ngày</p>
          </div>
          <div className="pay-filter-actions">
            <button className="pay-btn ghost" onClick={handleClear}>
              Xoá lọc
            </button>
            <button className="pay-btn primary" onClick={() => refetch()}>
              Áp dụng
            </button>
          </div>
        </div>
        <div className="pay-filters">
          <div className="pay-input-group">
            <label>Operator ID</label>
            <select
              value={filters.operatorId}
              onChange={(e) => setFilter('operatorId', e.target.value)}
              disabled={isLoadingAccounts}
            >
              <option value="">Tất cả</option>
              {operatorOptions.map((op: any) => (
                <option key={op.id} value={op.id}>
                  {op.label}
                </option>
              ))}
            </select>
            {isLoadingAccounts && (
              <small className="pay-hint">Đang tải danh sách operator...</small>
            )}
            {accountError && (
              <small className="pay-hint error">Không tải được danh sách operator</small>
            )}
          </div>
          <div className="pay-input-group">
            <label>Trạng thái</label>
            <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">Tất cả</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="pay-input-group">
            <label>Loại thanh toán</label>
            <select
              value={filters.paymentType}
              onChange={(e) => setFilter('paymentType', e.target.value)}
            >
              <option value="">Tất cả</option>
              {paymentTypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="pay-input-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilter('fromDate', e.target.value)}
            />
          </div>
          <div className="pay-input-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilter('toDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pay-panel">
        <div className="pay-panel-header">
          <div>
            <h3>Danh sách hoá đơn</h3>
            <p>Hiển thị dạng thẻ, dễ đọc và tra cứu</p>
          </div>
          <div className="pay-status-group">
            {isFetching && <span className="pay-chip info">Đang tải...</span>}
            {notFoundError && <span className="pay-chip info">Không tìm thấy hoá đơn</span>}
            {error && !notFoundError && (
              <span className="pay-chip danger">Không tìm thấy hoá đơn</span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="pay-loading">
            <div className="spinner" />
            <p>Đang tải danh sách...</p>
          </div>
        ) : notFoundError ? (
          <div className="pay-empty">
            <p>
              Không tìm thấy hoá đơn phù hợp. Thử đổi bộ lọc hoặc kiểm tra lại điều kiện tìm kiếm.
            </p>
            <button className="pay-btn ghost" onClick={handleClear}>
              Xoá bộ lọc
            </button>
          </div>
        ) : error ? (
          <div className="pay-empty">
            <p>Lỗi tải dữ liệu. Vui lòng thử lại.</p>
            <button className="pay-btn ghost" onClick={() => refetch()}>
              Thử lại
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="pay-empty">
            <p>Chưa có hoá đơn nào.</p>
          </div>
        ) : (
          <div className="pay-card-grid">
            {payments.map((p: any) => (
              <div className="pay-card" key={p.id}>
                <div className="pay-card-top">
                  <div className={`pay-badge status ${p.status?.toLowerCase() || 'pending'}`}>
                    {p.status || '-'}
                  </div>
                  <div className="pay-amount">{formatMoney(p.amount)}</div>
                </div>
                <div className="pay-card-meta">
                  <div className="pay-row">
                    <span className="pay-label">Loại</span>
                    <span
                      className={`pay-value pay-type ${
                        p.paymentType === 'OperatorCharge' ? 'green' : 'yellow'
                      }`}
                    >
                      {p.paymentType || '-'}
                    </span>
                  </div>
                  <div className="pay-row">
                    <span className="pay-label">Operator</span>
                    <span className="pay-value mono">{p.operatorId}</span>
                  </div>
                  <div className="pay-row">
                    <span className="pay-label">Invoice</span>
                    <span className="pay-value mono">{p.xenditInvoiceId}</span>
                  </div>
                  <div className="pay-row">
                    <span className="pay-label">Tạo lúc</span>
                    <span className="pay-value">{formatDate(p.createdAt)}</span>
                  </div>
                  <div className="pay-row">
                    <span className="pay-label">Refunded</span>
                    <span className="pay-value">{formatMoney(p.totalRefundedAmount)}</span>
                  </div>
                </div>
                <div className="pay-card-actions">
                  <a
                    className="pay-btn ghost"
                    href={p.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở checkout
                  </a>
                  <button
                    className="pay-btn subtle"
                    onClick={() => navigator.clipboard.writeText(p.id)}
                  >
                    Copy ID
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagePayment
