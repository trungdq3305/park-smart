import React from 'react'
import { Modal, Button, Descriptions, Tag } from 'antd'
import type { Account } from '../../types/Account'

interface AccountDetailsModalProps {
  open: boolean
  onClose: () => void
  account: Account | null
  onEdit: (account: Account) => void
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  open,
  onClose,
  account,
  onEdit
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

  const handleEdit = () => {
    if (account) {
      onClose()
      onEdit(account)
    }
  }

  return (
    <Modal
      title="Chi tiết tài khoản"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button 
          key="edit" 
          type="primary"
          onClick={handleEdit}
        >
          Chỉnh sửa
        </Button>
      ]}
    >
      {account && (
        <div className="account-details-content">
          <Descriptions title="Thông tin cơ bản" bordered column={2}>
            <Descriptions.Item label="Email">
              {account.email}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {account.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              <Tag color={getRoleBadgeColor(account.roleName)}>
                {account.roleName}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={account.isActive ? 'green' : 'red'}>
                {account.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lần đăng nhập cuối" span={2}>
              {account.lastLoginAt 
                ? new Date(account.lastLoginAt).toLocaleString('vi-VN')
                : 'Chưa đăng nhập'
              }
            </Descriptions.Item>
          </Descriptions>

          {/* Role-specific details */}
          {account.driverDetail && (
            <Descriptions 
              title="Thông tin Driver" 
              bordered 
              column={2}
              style={{ marginTop: 16 }}
            >
              <Descriptions.Item label="Tên đầy đủ">
                {account.driverDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {account.driverDetail.gender ? 'Nam' : 'Nữ'}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm tín dụng">
                {account.driverDetail.creditPoint}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm tích lũy">
                {account.driverDetail.accumulatedPoints}
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực">
                <Tag color={account.driverDetail.isVerified ? 'green' : 'red'}>
                  {account.driverDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}

          {account.operatorDetail && (
            <Descriptions 
              title="Thông tin Operator" 
              bordered 
              column={2}
              style={{ marginTop: 16 }}
            >
              <Descriptions.Item label="Tên đầy đủ">
                {account.operatorDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Tên công ty">
                {account.operatorDetail.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="Mã số thuế">
                {account.operatorDetail.taxCode}
              </Descriptions.Item>
              <Descriptions.Item label="Email liên hệ">
                {account.operatorDetail.contactEmail}
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực">
                <Tag color={account.operatorDetail.isVerified ? 'green' : 'red'}>
                  {account.operatorDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}

          {account.adminDetail && (
            <Descriptions 
              title="Thông tin Admin" 
              bordered 
              column={2}
              style={{ marginTop: 16 }}
            >
              <Descriptions.Item label="Tên đầy đủ">
                {account.adminDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {account.adminDetail.department}
              </Descriptions.Item>
              <Descriptions.Item label="Chức vụ">
                {account.adminDetail.position}
              </Descriptions.Item>
            </Descriptions>
          )}
        </div>
      )}
    </Modal>
  )
}

export default AccountDetailsModal
