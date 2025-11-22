import React from 'react'
import { Modal, Button, Descriptions, Tag, message } from 'antd'
import type { Account } from '../../types/Account'
import { useConfirmOperatorMutation } from '../../features/admin/accountAPI'

interface AccountDetailsModalProps {
  open: boolean
  onClose: () => void
  account: Account | null
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ open, onClose, account }) => {
  const [confirmOperator, { isLoading: isConfirmingOperator }] = useConfirmOperatorMutation()

  const handleConfirmOperator = async () => {
    if (account?._id) {
      await confirmOperator(account._id).unwrap()
      message.success('Xác nhận tài khoản operator thành công')
    }
  }
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
      title="Chi tiết tài khoản"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      {account && (
        <div className="account-details-content">
          <Descriptions title="Thông tin cơ bản" bordered column={2}>
            <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{account.phoneNumber}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">
              <Tag color={getRoleBadgeColor(account.roleName)}>{account.roleName}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={account.isActive ? 'green' : 'red'}>
                {account.isActive ? 'Hoạt động' : 'Không hoạt động'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lần đăng nhập cuối" span={2}>
              {account.lastLoginAt
                ? new Date(account.lastLoginAt).toLocaleString('vi-VN')
                : 'Chưa đăng nhập'}
            </Descriptions.Item>
          </Descriptions>

          {/* Role-specific details */}
          {account.driverDetail && (
            <Descriptions title="Thông tin Driver" bordered column={2} style={{ marginTop: 16 }}>
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
            <Descriptions title="Thông tin Operator" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Tên đầy đủ">
                {account.operatorDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Tên doanh nghiệp">
                {account.operatorDetail.bussinessName}
              </Descriptions.Item>
              <Descriptions.Item label="Mã số thuế">
                {account.operatorDetail.taxCode ? account.operatorDetail.taxCode : 'Không có'}
              </Descriptions.Item>
              <Descriptions.Item label="Email thanh toán">
                {account.operatorDetail.paymentEmail
                  ? account.operatorDetail.paymentEmail
                  : 'Không có'}
              </Descriptions.Item>
              <Descriptions.Item label="Xác thực">
                <Tag color={account.operatorDetail.isVerified ? 'green' : 'red'}>
                  {account.operatorDetail.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Duyệt tài khoản">
                <Button
                  type="primary"
                  onClick={handleConfirmOperator}
                  loading={isConfirmingOperator}
                >
                  {isConfirmingOperator ? 'Đang duyệt...' : 'Duyệt'}
                </Button>
              </Descriptions.Item>
            </Descriptions>
          )}

          {account.adminDetail && (
            <Descriptions title="Thông tin Admin" bordered column={2} style={{ marginTop: 16 }}>
              <Descriptions.Item label="Tên đầy đủ">
                {account.adminDetail.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {account.adminDetail.department}
              </Descriptions.Item>
              <Descriptions.Item label="Chức vụ">{account.adminDetail.position}</Descriptions.Item>
            </Descriptions>
          )}
        </div>
      )}
    </Modal>
  )
}

export default AccountDetailsModal
