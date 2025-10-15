import React from 'react'
import { Modal, Button, Tag } from 'antd'
import type { Account } from '../../types/Account'

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  account: Account | null
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  account
}) => {
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'purple'
      case 'operator':
        return 'blue'
      case 'driver':
        return 'orange'
      default:
        return 'default'
    }
  }

  return (
    <Modal
      title="Xác nhận xóa tài khoản"
      open={open}
      onCancel={onClose}
      width={500}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button 
          key="delete" 
          type="primary" 
          danger
          onClick={onConfirm}
        >
          Xóa tài khoản
        </Button>
      ]}
    >
      {account && (
        <div className="delete-confirmation-content">
          <div className="warning-section">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <h3>Bạn có chắc chắn muốn xóa tài khoản này?</h3>
              <p>
                Tài khoản <strong>{account.email}</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
            </div>
          </div>
          
          <div className="account-preview">
            <div className="account-avatar">
              {account.email.charAt(0).toUpperCase()}
            </div>
            <div className="account-info">
              <h4>{account.email}</h4>
              <p>{account.phoneNumber}</p>
              <Tag color={getRoleBadgeColor(account.roleName)}>
                {account.roleName}
              </Tag>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default DeleteConfirmModal
