import React, { useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  LoadingOutlined,
  LinkOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useConfirmPaymentQuery } from '../../../features/operator/invoiceAPI'
import './PaymentConfirm.css'

const PaymentConfirm: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const result = (searchParams.get('result') || '').toLowerCase()
  const paymentId = searchParams.get('paymentId') || ''
  const externalId = searchParams.get('externalId') || ''
  const operatorId = searchParams.get('operatorId') || ''
  const type = searchParams.get('type') || ''

  const isSuccess = result === 'success'
  const shouldCallApi = !!paymentId

  const { data, isLoading, error } = useConfirmPaymentQuery({ paymentId }, { skip: !shouldCallApi })

  const apiStatus = useMemo(() => {
    if (!shouldCallApi) return 'missing'
    if (isLoading) return 'loading'
    if (error) return 'error'
    return 'done'
  }, [shouldCallApi, isLoading, error])

  const handleBack = () => {
    navigate('/operator/parking-lot')
  }

  return (
    <div className="pay-confirm-page">
      <div className="pay-confirm-card">
        <div className="pay-confirm-icon">
          {apiStatus === 'loading' ? (
            <LoadingOutlined style={{ fontSize: 48, color: '#4f46e5' }} />
          ) : isSuccess ? (
            <CheckCircleTwoTone twoToneColor="#22c55e" style={{ fontSize: 52 }} />
          ) : (
            <CloseCircleTwoTone twoToneColor="#ef4444" style={{ fontSize: 52 }} />
          )}
        </div>

        <h1>{isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</h1>
        <p className="pay-confirm-sub">
          {isSuccess
            ? (typeof data === 'string' ? data : (data as any)?.message) ||
              'Cảm ơn bạn, thanh toán đã được xác nhận.'
            : 'Không thể xác nhận thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.'}
        </p>

        <div className="pay-confirm-details">
          <div className="pay-confirm-row">
            <span className="label">Payment ID</span>
            <span className="value mono">{paymentId || '—'}</span>
          </div>
          <div className="pay-confirm-row">
            <span className="label">External ID</span>
            <span className="value mono">{externalId || '—'}</span>
          </div>
          <div className="pay-confirm-row">
            <span className="label">Operator</span>
            <span className="value mono">{operatorId || '—'}</span>
          </div>
          <div className="pay-confirm-row">
            <span className="label">Loại</span>
            <span className="value">{type || '—'}</span>
          </div>
          <div className="pay-confirm-row">
            <span className="label">API</span>
            <span className="value">
              <LinkOutlined /> /core/payments/confirm
            </span>
          </div>
          <div className="pay-confirm-row">
            <span className="label">Kết quả</span>
            <span className={`badge ${isSuccess ? 'success' : 'fail'}`}>
              {isSuccess ? 'SUCCESS' : 'FAILED'}
            </span>
          </div>
          {!isSuccess && (
            <div className="pay-confirm-error">
              Không thể xác nhận thanh toán. Vui lòng thử lại sau.
            </div>
          )}
        </div>

        <div className="pay-confirm-actions">
          <button className="btn ghost" onClick={handleBack}>
            <ArrowLeftOutlined /> Về trang bãi xe
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentConfirm
