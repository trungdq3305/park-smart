import React from 'react'
import dayjs from 'dayjs'
import CustomModal from '../common/CustomModal'
import './OperatorDetailsModal.css'

interface OperatorDetailsModalProps {
  open: boolean
  onClose: () => void
  operatorData: any | null
  loading: boolean
  error?: boolean
}

const OperatorDetailsModal: React.FC<OperatorDetailsModalProps> = ({
  open,
  onClose,
  operatorData,
  loading,
  error,
}) => {
  const data = operatorData?.data

  return (
    <CustomModal open={open} onClose={onClose} title="Thông tin operator" width="520px">
      {loading ? (
        <div className="pay-operator-loading">Đang tải thông tin operator...</div>
      ) : error ? (
        <div className="pay-operator-error">Không tải được thông tin operator.</div>
      ) : !data ? (
        <div className="pay-operator-empty">Chưa có dữ liệu operator.</div>
      ) : (
        <div className="pay-operator-info">
          <div className="pay-operator-row">
            <span className="label">Tên</span>
            <span className="value">{data?.operatorDetail?.fullName || data?.fullName || '-'}</span>
          </div>
          <div className="pay-operator-row">
            <span className="label">Email</span>
            <span className="value">{data?.email || '-'}</span>
          </div>
          <div className="pay-operator-row">
            <span className="label">SĐT</span>
            <span className="value">{data?.phoneNumber || '-'}</span>
          </div>
          <div className="pay-operator-row">
            <span className="label">Operator ID</span>
            <span className="value mono">{data?.operatorDetail?._id || '-'}</span>
          </div>
          <div className="pay-operator-row">
            <span className="label">Trạng thái</span>
            <span className="value">{data?.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="pay-operator-row">
            <span className="label">Doanh nghiệp</span>
            <span className="value">{data?.operatorDetail?.bussinessName || '-'}</span>
          </div>
          <div className="pay-operator-row">
            <span className="label">Payment email</span>
            <span className="value">{data?.operatorDetail?.paymentEmail || '-'}</span>
          </div>
          <div className="pay-operator-row">
            <span className="label">Last login</span>
            <span className="value">
              {data?.lastLoginAt ? dayjs(data.lastLoginAt).format('DD/MM/YYYY HH:mm') : '-'}
            </span>
          </div>
        </div>
      )}
    </CustomModal>
  )
}

export default OperatorDetailsModal

